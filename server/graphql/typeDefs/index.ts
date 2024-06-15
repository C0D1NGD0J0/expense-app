import { mergeTypeDefs } from '@graphql-tools/merge';

import { userTypeDef } from './user.typedef';
import { authTypeDef } from './auth.typedef';
import { transactionTypeDef } from './transaction.typedef';

export const mergedTypeDefs = mergeTypeDefs([userTypeDef, authTypeDef, transactionTypeDef]);
