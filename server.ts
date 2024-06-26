import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express, { Application, Request, Response } from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer, BaseContext } from '@apollo/server';
import Logger from 'bunyan';
import http from 'http';

import { mergedResolver, mergedTypeDefs } from '@graphql/index';
import { errorHandler } from '@/utils/helper/errorHandler';
import { ICurrentUser } from '@/interfaces';
import { createLogger } from '@/utils';
import { App, AppSetup } from './app';
import { db } from '@db/index';

export type Context = BaseContext & {
  req: Request;
  res: Response;
  user: ICurrentUser | null;
};

class Server {
  private logger: Logger;
  private app: AppSetup;
  private expApp: Application;
  private httpServer: http.Server | undefined;
  private apolloServer: ApolloServer<Context>;
  private PORT = process.env.PORT || 5000;

  constructor() {
    this.expApp = express();
    this.app = new App(this.expApp);
    this.logger = createLogger('Server');
  }

  init() {
    (async () => {
      if (await db.isDbConnected()) {
        await db.connectToRedis();
        this.app.initApp();
        this.httpServer = this.initHttpServer(this.expApp);
        this.apolloServer = await this.initApolloServer(this.httpServer);
      } else {
        this.logger.error('DB connection missing.');
        throw new Error('Missing DB connection..');
      }
    })();
  }

  async getServerInstances(): Promise<{
    apolloServer: ApolloServer<Context>;
    httpServer: http.Server | null;
  }> {
    return {
      apolloServer: this.apolloServer,
      httpServer: this.httpServer ?? null,
    };
  }

  private async initApolloServer(
    httpServer: http.Server | undefined
  ): Promise<ApolloServer<Context>> {
    if (!httpServer) {
      this.logger.error('Unable to start Graphql server');
      throw new Error('Unable to start GraphQL server');
    }

    const server = new ApolloServer<Context>({
      introspection: true,
      typeDefs: mergedTypeDefs,
      resolvers: mergedResolver,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
      formatError: (err) => {
        return {
          message: errorHandler(err),
        };
      },
    });

    await server.start();
    this.expApp.use(
      '/graphql',
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          console.log(new Date());
          return { req, res, user: null };
        },
      })
    );

    return server;
  }

  private initHttpServer(app: Application) {
    try {
      const _httpServer: http.Server = new http.Server(app);
      this.startHTTPServer(_httpServer);
      return _httpServer;
    } catch (error: unknown) {
      this.logger.error('Error: ', (error as Error).message);
    }
  }

  private startHTTPServer(httpServer: http.Server): void {
    httpServer.listen(this.PORT, () => {
      console.info(`
        Express server is live at http://localhost:${this.PORT}
        GraphQL playground is live at http://localhost:${this.PORT}/graphql
      `);
    });

    // unhandled promise rejection
    process.once('unhandledRejection', (err: any) => {
      this.logger.error(`Error: ${err.message}`);
    });
  }
}

const server = new Server();
server.init();
