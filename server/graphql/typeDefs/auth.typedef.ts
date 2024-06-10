import { IEmailOptions } from "@/types/utils.types";
export const authTypeDef = `#graphql
  input SignupInput {
    dob: String
    email: String!
    avatar: String
    lastName: String!
    password: String!
    location: String!
    firstName: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    password: String!
  }

  type SignupResponse {
    success: Boolean!
    msg: String!
  }

  type LoginResponse {
    success: Boolean!
    msg: String!
    # data in this instance should be jwt token
    data: String!
  }

  type Mutation {
    logout: String
    signup(input: SignupInput): SignupResponse
    login(email: String!, pwd: String!): LoginResponse
    resetPassword(input: ResetPasswordInput): String!
    forgotPassword(input: ForgotPasswordInput): String!
  }
`;
