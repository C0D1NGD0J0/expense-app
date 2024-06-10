import { GraphQLError } from "graphql";
import { ZodError, ZodIssue, ZodSchema } from "zod";

// Validation Middleware
export const validateInput =
  (schema: ZodSchema<any>) =>
  (resolve: any) =>
  async (parent: any, args: any, context: any, info: any) => {
    try {
      const res = schema.parse(args.input);
      // console.log(res, "---res");
      return resolve(parent, args, context, info);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = (err: ZodError) => {
          return JSON.stringify(err.errors.map((error) => error.message));
        };

        throw new GraphQLError(errorMessages(error), {
          extensions: {
            code: "VALIDATION_ERROR",
          },
        });
      }

      if (error instanceof GraphQLError) {
        console.log(typeof error, "---erro2r");
        throw new GraphQLError(error.message, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
          },
        });
      }

      throw new GraphQLError("Internal Server Error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          message: (error as Error).message,
        },
      });
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
