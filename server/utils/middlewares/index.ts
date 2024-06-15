import { GraphQLResolveInfo } from 'graphql';
import { ZodError, ZodSchema } from 'zod';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';

import { RateLimitOptions } from '@interfaces/index';
import { redisConnection } from '@config/index';
import { AUTH_TOKEN } from '../helper';
import { authCache } from '@/caching';
import { Context } from 'server';

type ResolverFn = (parent: any, args: any, context: Context, info: GraphQLResolveInfo) => Promise<any>;

// Validation Middleware
export const validateInput =
  (schema: ZodSchema<any>) =>
  (resolve: any): ResolverFn =>
  async (parent, args, context, info) => {
    try {
      schema.parseAsync(args.input);
      return resolve(parent, args, context, info);
    } catch (error) {
      if (error instanceof ZodError) {
        console.log('----ERR----', error);
        const errorMessages = (err: ZodError) => {
          return JSON.stringify(err.errors.map((error) => error.message));
        };

        throw new GraphQLError(errorMessages(error), {
          extensions: {
            code: 'VALIDATION_ERROR',
            message: 'fucking hell',
          },
        });
      }

      throw new GraphQLError('Internal Server Error', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message,
        },
      });
    }
  };

// Authentication Middleware
export const isAuthenticated =
  (resolver: ResolverFn): ResolverFn =>
  async (parent, args, context, info) => {
    const { req } = context;

    let token = req.cookies[AUTH_TOKEN];
    if (token && token.startsWith('Bearer')) {
      token = token.split(' ')[1];
    }

    if (!token) {
      throw new GraphQLError('Authentication Error', {
        extensions: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Please login to proceed.',
        },
      });
    }

    try {
      const decoded = <{ userId: string; iat: number; exp: number }>jwt.verify(token, process.env.JWT_SECRET as string);
      const resp = await authCache.getCurrentUser(decoded.userId);

      if (resp.success) {
        // add logged-in user info into global context obj
        context.user = resp.data;
      }
      return resolver(parent, args, context, info);
    } catch (error: Error | any) {
      console.log(error, '---err');
    }
  };

// rate limiter middlware
export const rateLimiter =
  (ratelimitOpts: RateLimitOptions) =>
  (resolver: any): ResolverFn =>
  async (parent, args, context, info) => {
    const { req } = context;
    const ip = req.ip;
    const key = `rl:${ip}:${info.fieldName}`;
    const redis = redisConnection.getRedisInstance();

    const results = await redis.incr(key);
    if (results === 1) {
      await redis.expire(key, ratelimitOpts.window);
    }

    if (results > ratelimitOpts.limit) {
      throw new Error('Rate limit exceeded');
    }

    return resolver(parent, args, context, info);
  };

export const applyMiddlewares =
  (middlewares: any[]) =>
  (resolver: ResolverFn): ResolverFn => {
    return middlewares.reduce((acc, middleware) => middleware(acc), resolver);
  };
