import { GraphQLError } from "graphql";
import { ZodError, ZodSchema } from "zod";

// Validation Middleware
export const validateInput =
  (schema: ZodSchema<any>) =>
  (resolve: any) =>
  async (parent: any, args: any, context: any, info: any) => {
    try {
      schema.parse(args);
      return resolve(parent, args, context, info);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new GraphQLError(error.message, {
          extensions: {
            code: "VALIDATION_ERROR",
          },
        });
      }
      if (error instanceof GraphQLError) {
        throw new GraphQLError(error.message, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
          },
        });
      }
    }
  };

// Authentication Middleware: TODO
export const authenticate =
  (resolve: any) => async (parent: any, args: any, context: any, info: any) => {
    if (!context.user) {
      throw new GraphQLError("Authentication required", {
        extensions: {
          code: "UNAUTHENTICATED",
        },
      });
    }
    return resolve(parent, args, context, info);
  };

export const applyMiddlewares =
  (...middlewares: any[]) =>
  (resolver: any) => {
    return middlewares.reduce((acc, middleware) => middleware(acc), resolver);
  };
