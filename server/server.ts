import express, { Application } from "express";
import http from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { App, AppSetup } from "./app";
import { resolvers, typeDefs } from "@graphql/index";

interface Context {
  rooftopId?: string;
}
class Server {
  private app: AppSetup;
  private expApp: Application;
  private PORT = process.env.PORT || 5000;

  constructor() {
    this.expApp = express();
    this.app = new App(this.expApp);
  }

  init() {
    this.app.initApp();
    const httpServer = this.initHttpServer(this.expApp);
    httpServer && this.initApolloServer(httpServer);
  }

  private async initApolloServer(httpServer: http.Server) {
    if (!httpServer) {
      throw new Error("Unable to start GraphQL server");
    }

    const server = new ApolloServer<Context>({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      formatError: (err) => {
        return {
          message: err.message,
        };
      },
    });

    await server.start();
    this.expApp.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req }) => {
          return { rooftopId: req.headers.authorization };
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
      console.error("Error: ", (error as Error).message);
    }
  }

  private startHTTPServer(httpServer: http.Server): void {
    httpServer.listen(this.PORT, () => {
      console.info(`
        Express server is live at http://localhost:${this.PORT}
        GraphQL server is live at http://localhost:${this.PORT}/graphql
      `);
    });

    // unhandled promise rejection
    process.once("unhandledRejection", (err: any) => {
      console.error(`Error: ${err.message}`);
    });
  }
}

new Server().init();
