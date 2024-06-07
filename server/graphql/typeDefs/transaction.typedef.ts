export const transactionTypeDef = `#graphql
  type Transaction {
    id: ID
    userId: ID!
    user: User
    description: String!
    amount: Float
    location: String                    
    name: String
    date: String
    category: String
    paymentType: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    transactions: [Transaction!]
    transaction(id: ID!): Transaction
  }

  type Mutation {
    deleteTransaction(id: ID!): Transaction
    addTransaction(input: AddTransactionInput): Transaction
    updateTransaction(input: UpdateTransactionInput): Transaction
  }

  input AddTransactionInput {
    description: String!
    amount: Float!
    location: String
    name: String!
    date: String!
    category: String!
    paymentType: String!
  }

  input UpdateTransactionInput {
    id: ID!
    description: String
    amount: Float
    location: String                    
    name: String
    date: String
    category: String
    paymentType: String
  }
`;
