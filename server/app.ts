import cors from "cors";
import dotenv from "dotenv";
import logger from "morgan";
import cookieParser from "cookie-parser";
import express, { Application, Express } from "express";

export interface AppSetup {
  initApp(): void;
}

export class App implements AppSetup {
  protected app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  initApp() {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.appErroHandler(this.app);
    this.routes(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cors({
        origin: ["localhost", "http://localhost:3000"],
        optionsSuccessStatus: 200,
        credentials: true,
      })
    );
  }

  private standardMiddleware(app: Application): void {
    if (process.env.NODE_ENV !== "production") {
      app.use(logger("dev"));
    }
    dotenv.config();
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
  }

  private routes(app: Application) {
    app.use("/status", (req, res) => {
      res.status(200).json({ success: true });
    });
  }

  private appErroHandler(app: Application): void {
    process.on("uncaughtException", (err: any) => {
      console.error("There was an uncaught error exception: ", err.message);
      this.serverShutdown(1);
    });

    process.on("unhandledRejection", async (err: Error) => {
      console.error("There was an unhandled rejection error: ", err.message);
      this.serverShutdown(2);
    });

    process.on("SIGTERM", (err: Error) => {
      console.error("There was a SIGTERM error: ", err.message);
    });
  }

  private serverShutdown(exitCode: number): void {
    Promise.resolve()
      .then(() => {
        console.info("Shutdown complete.");
        process.exit(exitCode);
      })
      .catch((error: Error) => {
        console.error("Error occured during shutdown: ", error.message);
        process.exit(1);
      });
  }
}
