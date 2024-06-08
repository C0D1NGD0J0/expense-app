import { GraphQLResolveInfo } from "graphql";

import { AuthService } from "@services/index";
import { applyMiddlewares, validateInput } from "@/utils/middlewares";
import { UserSignUpSchema } from "@/utils/validations";
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
    login: async () => {
      return true;
    },
    logout: async () => {
      return true;
    },
    resetPassword: async () => {
      return true;
    },
    forgotPassword: async () => {
      return true;
    },
  },
};
