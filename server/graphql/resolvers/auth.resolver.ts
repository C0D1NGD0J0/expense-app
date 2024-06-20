import { GraphQLError, GraphQLResolveInfo } from 'graphql';

import { applyMiddlewares, rateLimiter, validateInput } from '@/utils/middlewares';
import {
  AccountActivationSchema,
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  UserSignUpSchema,
} from '@/utils/validations';
import { IUserSignUp } from '@/interfaces/user.interface';
import {
  AUTH_EMAIL_JOB,
  ACCESS_TOKEN,
  RATE_LIMIT_OPTS,
  RESET_PASSWORD_JOB,
  FORGOT_PASSWORD_JOB,
  setAuthCookie,
  REFRESH_TOKEN,
} from '@/utils';
import { emailQueue } from '@/services/queues';
import { authService, tokenService } from '@services/index';
import { authCache } from '@/caching';

export const authResolver = {
  Mutation: {
    signup: applyMiddlewares([rateLimiter(RATE_LIMIT_OPTS), validateInput(UserSignUpSchema)])(
      async (
        _root: any,
        { input }: { input: IUserSignUp },
        _cxt: any,
        _info: GraphQLResolveInfo
      ) => {
        const { data, ...rest } = await authService.signup(input);
        emailQueue.addMailToJobQueue(AUTH_EMAIL_JOB, data);
        return rest;
      }
    ),
    accountActivation: applyMiddlewares([validateInput(AccountActivationSchema)])(
      async (
        _root: any,
        { input }: { input: { token: string } },
        _cxt: any,
        _info: GraphQLResolveInfo
      ) => {
        const resp = await authService.activateAccount(input.token);
        return resp;
      }
    ),
    login: applyMiddlewares([rateLimiter(RATE_LIMIT_OPTS), validateInput(LoginSchema)])(
      async (_, { input }: { input: { email: string; password: string } }, cxt, ___) => {
        const { res } = cxt;
        const result = await authService.login(input.email, input.password);
        // Saving data to redis cache
        authCache.saveAuthTokens(result.data.user.id, [result.data.jwt, result.data.refreshToken]);
        authCache.saveCurrentUser(result.data.user);

        // Add jwt to cookie
        setAuthCookie(ACCESS_TOKEN, result.data.jwt, res);
        setAuthCookie(REFRESH_TOKEN, result.data.refreshToken, res);
        return { success: true, msg: 'Login was successful.' };
      }
    ),
    logout: async () => {
      return true;
    },
    forgotPassword: applyMiddlewares([
      rateLimiter(RATE_LIMIT_OPTS),
      validateInput(ForgotPasswordSchema),
    ])(
      async (
        _root: any,
        { input }: { input: { email: string } },
        _cxt: any,
        _info: GraphQLResolveInfo
      ) => {
        const { data, ...rest } = await authService.forgotPassword(input.email);
        emailQueue.addMailToJobQueue(FORGOT_PASSWORD_JOB, data);
        return rest;
      }
    ),
    resetPassword: applyMiddlewares([
      rateLimiter(RATE_LIMIT_OPTS),
      validateInput(ResetPasswordSchema),
    ])(
      async (
        _root: any,
        { input }: { input: { token: string; password: string } },
        _cxt: any,
        _info: GraphQLResolveInfo
      ) => {
        const { data, ...rest } = await authService.resetPassword(input.token, input.password);
        emailQueue.addMailToJobQueue(RESET_PASSWORD_JOB, data);
        return rest;
      }
    ),
    refreshToken: applyMiddlewares([rateLimiter(RATE_LIMIT_OPTS)])(async (_, args, cxt, ___) => {
      const { req, res, user } = cxt;
      const cookies = req.cookies;

      if (!cookies[REFRESH_TOKEN]) {
        throw new GraphQLError('Authentication Error', {
          extensions: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Access denied, please login again.',
          },
        });
      }

      const decoded = tokenService.decodeJwt(cookies[REFRESH_TOKEN]);
      if (!decoded.success || !decoded.data) {
        throw new GraphQLError('Authentication Error', {
          extensions: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Session expired, please login again.',
          },
        });
      }
      // Saving data to redis cache
      const { accessToken, refreshToken: newRefreshToken } = tokenService.createJwtTokens(
        decoded.data?.userId
      );
      authCache.saveAuthTokens(decoded.data.userId, [accessToken, newRefreshToken]);
      user && authCache.saveCurrentUser(user);
      // Add jwt to cookies
      setAuthCookie(ACCESS_TOKEN, accessToken, res);
      setAuthCookie(REFRESH_TOKEN, newRefreshToken, res);
      return { success: true, msg: 'Login was successful.' };
    }),
  },
};
