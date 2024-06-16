import { GraphQLResolveInfo } from 'graphql';

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
  AUTH_TOKEN,
  RATE_LIMIT_OPTS,
  RESET_PASSWORD_JOB,
  FORGOT_PASSWORD_JOB,
  setAuthCookie,
} from '@/utils';
import { emailQueue } from '@/services/queues';
import { authService } from '@services/index';
import { authCache } from '@/caching';

export const authResolver = {
  Mutation: {
    signup: applyMiddlewares([rateLimiter(RATE_LIMIT_OPTS), validateInput(UserSignUpSchema)])(
      async (_root: any, { input }: { input: IUserSignUp }, _cxt: any, _info: GraphQLResolveInfo) => {
        const { data, ...rest } = await authService.signup(input);
        emailQueue.addMailToJobQueue(AUTH_EMAIL_JOB, data);
        return rest;
      }
    ),
    accountActivation: applyMiddlewares([validateInput(AccountActivationSchema)])(
      async (_root: any, { input }: { input: { token: string } }, _cxt: any, _info: GraphQLResolveInfo) => {
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
        setAuthCookie(AUTH_TOKEN, parseInt(process.env.COOKIE_MAXAGE as string), '/', result.data.jwt, res);
        return { success: true, msg: 'Login was successful.' };
      }
    ),
    logout: async () => {
      return true;
    },
    forgotPassword: applyMiddlewares([rateLimiter(RATE_LIMIT_OPTS), validateInput(ForgotPasswordSchema)])(
      async (_root: any, { input }: { input: { email: string } }, _cxt: any, _info: GraphQLResolveInfo) => {
        const { data, ...rest } = await authService.forgotPassword(input.email);
        emailQueue.addMailToJobQueue(FORGOT_PASSWORD_JOB, data);
        return rest;
      }
    ),
    resetPassword: applyMiddlewares([rateLimiter(RATE_LIMIT_OPTS), validateInput(ResetPasswordSchema)])(
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
  },
};
