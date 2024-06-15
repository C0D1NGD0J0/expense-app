// import { GraphQLResolveInfo } from 'graphql';

import { applyMiddlewares, isAuthenticated } from '@/utils/middlewares';
// import { authService } from '@services/index';
// import { authCache } from '@/caching';

const userResolver = {
  Query: {
    getCurrentUser: applyMiddlewares([isAuthenticated])(async (_root: any, _args, cxt, _info) => {}),
  },
  Mutation: {},
};

export default userResolver;
