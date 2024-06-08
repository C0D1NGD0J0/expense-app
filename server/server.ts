import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@apollo/server/express4";
import express, { Application } from "express";
import { ApolloServer } from "@apollo/server";
import Logger from "bunyan";
import http from "http";

import { mergedResolver, mergedTypeDefs } from "@graphql/index";
import { createLogger } from "@utils/index";
import { App, AppSetup } from "./app";
import { isDbConnected } from "./db";

class Server {
  private logger: Logger;
  private app: AppSetup;
  private expApp: Application;
  private PORT = process.env.PORT || 5000;

  constructor() {
    this.expApp = express();
    this.app = new App(this.expApp);
    this.logger = createLogger("Server");
  }

  init() {
    (async () => {
      if (await isDbConnected()) {
        this.app.initApp();
        const httpServer = this.initHttpServer(this.expApp);
        httpServer && this.initApolloServer(httpServer);
      } else {
        this.logger.error("DB connection missing.");
        throw new Error("Missing DB connection..");
      }
    })();
  }

  private async initApolloServer(httpServer: http.Server) {
    if (!httpServer) {
      this.logger.error("Unable to start Graphql server");
      throw new Error("Unable to start GraphQL server");
    }

    const server = new ApolloServer({
      typeDefs: mergedTypeDefs,
      resolvers: mergedResolver,
      introspection: process.env.NODE_ENV !== "production",
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      formatError: (err) => {
        return {
          message: JSON.parse(err.message),
        };
      },
    });

    await server.start();
    this.expApp.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req }) => {
          return { req };
        },
      })
    );
  }

  private initHttpServer(app: Application) {
    try {
      const _httpServer: http.Server = new http.Server(app);
      this.startHTTPServer(_httpServer);
      return _httpServer;
    } catch (error: unknown) {
      this.logger.error("Error: ", (error as Error).message);
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
    process.once("unhandledRejection", (err: any) => {
      this.logger.error(`Error: ${err.message}`);
    });
  }
}

new Server().init();
