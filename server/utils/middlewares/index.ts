import { GraphQLResolveInfo } from 'graphql';
import { ZodError, ZodSchema } from 'zod';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';

import { RateLimitOptions } from '@interfaces/index';
import { redisConnection } from '@config/index';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@utils/helper';
import { authCache } from '@caching/index';
import { Context } from 'server';
import { tokenService } from '@services/index';

type ResolverFn = (
  parent: any,
  args: any,
  context: Context,
  info: GraphQLResolveInfo
) => Promise<any>;

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

    let token = req.cookies[ACCESS_TOKEN];
    if (token && token.startsWith('Bearer')) {
      token = token.split(' ')[1];
    }

    if (!token) {
      throw new GraphQLError('Authentication Error', {
        extensions: {
          code: 'AUTHENTICATION_ERROR',
          message: 'No valid authentication means.',
          http: { status: 401 },
        },
      });
    }

    try {
      const decoded = <{ userId: string; iat: number; exp: number }>(
        jwt.verify(token, process.env.JWT_SECRET as string)
      );
      const resp = await authCache.getCurrentUser(decoded.userId);

      if (resp.success && resp.data) {
        // add logged-in user info into global context obj
        context.user = resp.data;
      }
      return resolver(parent, args, context, info);
    } catch (error: Error | any) {
      if (error instanceof jwt.TokenExpiredError) {
        // error code should initiate refresh-token process from the frontend
        throw new GraphQLError('Authentication Error', {
          extensions: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Please login to proceed.',
            http: { status: 419 },
          },
        });
      }

      throw new GraphQLError('Authentication Error', {
        extensions: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Please login again...',
          http: { status: 401 },
        },
      });
    }
  };

export const generateRefreshToken =
  (resolver: ResolverFn): ResolverFn =>
  async (parent, args, context, info) => {
    const { req } = context;
    const cookies = req.cookies;

    if (!cookies[ACCESS_TOKEN] && !cookies[REFRESH_TOKEN]) {
      throw new GraphQLError('Authentication Error', {
        extensions: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Access denied, please login again.',
        },
      });
    }

    const oldRefreshToken = cookies[REFRESH_TOKEN].split(' ')[1];
    // Attempt to decode the access token to get userId
    const decoded = jwt.decode(oldRefreshToken) as {
      userId: string;
      iat: number;
      exp: number;
    };

    try {
      if (decoded && decoded.userId) {
        const cacheTokens = await authCache.getAuthTokens(decoded.userId);

        if (!cacheTokens.success || !cacheTokens.data?.length) {
          console.log('No saved tokens found for user');
          throw new GraphQLError('Authentication Error', {
            extensions: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Access denied, please login again.',
            },
          });
        }

        const cachedRefreshToken = cacheTokens?.data[1].split(' ')[1];
        if (oldRefreshToken !== cachedRefreshToken) {
          // invalid/malformed token
          throw new GraphQLError('Authentication Error', {
            extensions: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Access denied, please login.',
            },
          });
        }

        const isValidToken = await tokenService.verifyJwtToken(REFRESH_TOKEN, cachedRefreshToken);
        if (!isValidToken.success) {
          // expired token
          throw new GraphQLError('Authentication Error', {
            extensions: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Access denied, please login.',
            },
          });
        }

        // proceed to issue new access/refresh tokens
        return resolver(parent, args, context, info);
      }

      throw new GraphQLError('Authentication Error', {
        extensions: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Access denied, please login.',
        },
      });
    } catch (error) {
      // Refresh token is also invalid
      authCache.logoutUser(decoded.userId);
      console.error(error);
      throw new GraphQLError('Authentication Error', {
        extensions: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Access denied, unauthorized.',
        },
      });
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
