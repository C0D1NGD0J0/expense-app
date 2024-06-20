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
    msg: String
  }

  type Mutation {
    logout: String
    refreshToken: Response
    login(input: LoginInput): Response
    signup(input: SignupInput): Response
    resetPassword(input: ResetPasswordInput): Response
    forgotPassword(input: ForgotPasswordInput): Response
    accountActivation(input: AccountActivationInput): Response
  }
`;
