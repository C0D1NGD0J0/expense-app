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

  type Mutation {
    logout: String
    signup(input: SignupInput): String
    login(email: String!, pwd: String!): String
    resetPassword(input: ResetPasswordInput): String!
    forgotPassword(input: ForgotPasswordInput): String!
  }
`;
