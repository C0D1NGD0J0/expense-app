import { GraphQLResolveInfo } from "graphql";

import { AuthService } from "@/services";
import { applyMiddlewares, validateInput } from "@/utils/middlewares";
import { UserSignUpSchema } from "@/utils/validations";
import { IUserSignUp } from "@/types/user.types";

const authService = new AuthService();
const authResolver = {
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

export default authResolver;
