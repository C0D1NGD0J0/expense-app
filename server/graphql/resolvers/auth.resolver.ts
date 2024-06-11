import { GraphQLResolveInfo } from "graphql";

import { authService } from "@services/index";
import {
  applyMiddlewares,
  rateLimiter,
  validateInput,
} from "@/utils/middlewares";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  UserSignUpSchema,
} from "@/utils/validations";
import { IUserSignUp } from "@/types/user.types";
import { emailQueue } from "@/services/queues";
import { RATE_LIMIT_OPTS } from "@/utils";

export const authResolver = {
  Mutation: {
    signup: applyMiddlewares([
      rateLimiter(RATE_LIMIT_OPTS),
      validateInput(UserSignUpSchema),
    ])(
      async (
        _root: any,
        { input }: { input: IUserSignUp },
        _cxt: any,
        _info: GraphQLResolveInfo
      ) => {
        const { data, ...rest } = await authService.signup(input);
        emailQueue.addMailToJobQueue("AUTH_EMAIL_JOB", data);
        return rest;
      }
    ),
    login: applyMiddlewares([
      rateLimiter(RATE_LIMIT_OPTS),
      validateInput(LoginSchema),
    ])(
      async (
        _root: any,
        { input }: { input: { email: string; password: string } },
        cxt: any,
        info: GraphQLResolveInfo
      ) => {
        return await authService.login(input.email, input.password);
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
        cxt: any,
        info: GraphQLResolveInfo
      ) => {
        return await authService.forgotPassword(input.email);
      }
    ),
    resetPassword: applyMiddlewares([
      rateLimiter(RATE_LIMIT_OPTS),
      validateInput(ResetPasswordSchema),
    ])(
      async (
        _root: any,
        { input }: { input: { token: string; password: string } },
        cxt: any,
        info: GraphQLResolveInfo
      ) => {
        return await authService.resetPassword(input.token, input.password);
      }
    ),
  },
};
