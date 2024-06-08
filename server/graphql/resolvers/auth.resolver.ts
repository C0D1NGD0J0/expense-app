import { GraphQLResolveInfo } from "graphql";

import { AuthService } from "@services/index";
import { applyMiddlewares, validateInput } from "@/utils/middlewares";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  UserSignUpSchema,
} from "@/utils/validations";
import { IUserSignUp } from "@/types/user.types";

const authService = new AuthService();
export const authResolver = {
  Mutation: {
    signup: applyMiddlewares(validateInput(UserSignUpSchema))(
      async (
        _root: any,
        { input }: { input: IUserSignUp },
        cxt: any,
        info: GraphQLResolveInfo
      ) => {
        return await authService.signup(input);
      }
    ),
    login: applyMiddlewares(validateInput(LoginSchema))(
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
    forgotPassword: applyMiddlewares(validateInput(ForgotPasswordSchema))(
      async (
        _root: any,
        { input }: { input: { email: string } },
        cxt: any,
        info: GraphQLResolveInfo
      ) => {
        return await authService.forgotPassword(input.email);
      }
    ),
    resetPassword: applyMiddlewares(validateInput(ResetPasswordSchema))(
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
