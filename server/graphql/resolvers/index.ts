import { mergeResolvers } from "@graphql-tools/merge";

import userResolver from "./user.resolver";
import authResolver from "./auth.resolver";
import transactionResolver from "./transaction.resolver";

export const mergedResolver = mergeResolvers([
  userResolver,
  authResolver,
  transactionResolver,
]);
