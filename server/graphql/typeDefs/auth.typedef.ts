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

  input AccountActivationInput {
    token: String!
  }

  input ResetPasswordInput {
    token: String!
    password: String!
  }

  type Response {
    success: Boolean!
    msg: String!
  }

  type Mutation {
    logout: String
    signup(input: SignupInput): Response
    resetPassword(input: ResetPasswordInput): String!
    login(input: LoginInput): Response
    forgotPassword(input: ForgotPasswordInput): String!
    accountActivation(input: AccountActivationInput): Response
  }
`;
