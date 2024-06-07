const authResolver = {
  Mutation: {
    signup: async () => {
      return true;
    },
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
