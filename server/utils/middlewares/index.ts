import { GraphQLResolveInfo } from "graphql";
import { ZodError, ZodSchema } from "zod";
import { GraphQLError } from "graphql";

import { redisConnection } from "@/services/redis/config";
import { RateLimitOptions } from "@/types/";

// Validation Middleware
export const validateInput =
  (schema: ZodSchema<any>) =>
  (resolve: any) =>
  async (parent: any, args: any, context: any, info: any) => {
    try {
      const res = schema.parse(args.input);
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
  (resolve: any) =>
  async (parent: any, args: any, context: any, info: GraphQLResolveInfo) => {
    if (!context.user) {
      throw new GraphQLError("Authentication required", {
        extensions: {
          code: "UNAUTHENTICATED",
        },
      });
    }
    return resolve(parent, args, context, info);
  };

// rate limiter middlware
export const rateLimiter =
  (ratelimitOpts: RateLimitOptions) =>
  (resolver: any) =>
  async (parent: any, args: any, context: any, info: GraphQLResolveInfo) => {
    const { req } = context;
    const ip = req.ip;
    const key = `rl:${ip}:${info.fieldName}`;
    const redis = redisConnection.getRedisInstance();

    const results = await redis.incr(key);
    if (results === 1) {
      await redis.expire(key, ratelimitOpts.window);
    }

    if (results > ratelimitOpts.limit) {
      throw new Error("Rate limit exceeded");
    }

    return resolver(parent, args, context, info);
  };

export const applyMiddlewares = (middlewares: any[]) => (resolver: any) => {
  return middlewares.reduce((acc, middleware) => middleware(acc), resolver);
};
