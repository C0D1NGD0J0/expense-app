import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bunyan from 'bunyan';
import logger from 'morgan';
import cors from 'cors';
import { createLogger } from '@utils/index';
import { serverAdapter } from '@/services/queues';

export interface AppSetup {
  initApp(): void;
}

export class App implements AppSetup {
  protected app: Application;
  private logger: bunyan;

  constructor(app: Application) {
    this.app = app;
    this.logger = createLogger('App-Setup');
  }

  initApp() {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routes(this.app);
    this.appErroHandler();
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cors({
        credentials: true,
        optionsSuccessStatus: 200,
        origin: ['localhost', 'http://localhost:5000', 'https://sandbox.embed.apollographql.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      })
    );
  }

  private standardMiddleware(app: Application): void {
    if (process.env.NODE_ENV !== 'production') {
      app.use(logger('dev'));
    }
    dotenv.config();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
  }

  private routes(app: Application) {
    app.use('/queues', serverAdapter.getRouter());
    app.use('/status', (req, res) => {
      res.status(200).json({ success: true });
    });
  }

  private appErroHandler(): void {
    process.on('uncaughtException', (err: any) => {
      this.logger.error('There was an uncaught error exception: ', err);
      this.serverShutdown(1);
    });

    process.on('unhandledRejection', async (err: Error) => {
      this.logger.error('There was an unhandled rejection error: ', err);
      this.serverShutdown(2);
    });

    process.on('SIGTERM', (err: Error) => {
      this.logger.error('There was a SIGTERM error: ', err);
    });
  }

  private serverShutdown(exitCode: number): void {
    Promise.resolve()
      .then(() => {
        this.logger.info('Shutdown complete.');
        process.exit(exitCode);
      })
      .catch((error: Error) => {
        this.logger.error('Error occured during shutdown: ', error.message);
        process.exit(1);
      });
  }
}
