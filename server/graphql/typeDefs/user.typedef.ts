export const userTypeDef = `#graphql
  type Address {
    street: String
    city: String
    state: String
    country: String
    postCode: String
    streetNumber: String
  }

  type ComputedLocation {
    coordinates: [Float]
    address: Address
    latAndlon: String
  }

  type User {
    id: String!
    dob: String
    email: String!
    avatar: String
    createdAt: String
    updatedAt: String
    lastName: String!
    password: String!
    location: String!
    isActive: Boolean!
    firstName: String!
    activationToken: String
    passwordResetToken: String
    activationTokenExpiresAt: String
    computedLocation: ComputedLocation!
    passwordResetTokenExpiresAt: String
  }

  type CurrentUser {
    id: String!
    dob: String
    email: String!
    avatar: String
    lastName: String!
    location: String!
    firstName: String!
  }

  type Query {
    users: [User!]
    user(id: ID!): User
    getCurrentUser: CurrentUser
  }

  type Mutation {
    updateAccount(input: UpdateAccountInput): User
  }

  input UpdateAccountInput {
    dob: String
    email: String!
    avatar: String
    lastName: String!
    password: String!
    location: String!
    firstName: String!
  }
`;
