// USER
export type IUser = {
  id: string;
  dob?: string;
  email: string;
  lastName: string;
  firstName: string;
  password: string;
  location?: string;
  avatar?: string;
  isActive: boolean;
  computedLocation: {
    coordinates: [number, number];
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postCode: string;
      streetNumber: string;
    };
    latAndlon?: string;
  };
  createdAt: string;
  updatedAt?: string;
  passwordResetToken?: string;
  passwordResetTokenExpiresAt?: Date;
  activationToken?: string;
  activationTokenExpiresAt?: Date;
};

export type IUserSignUp = Omit<
  IUser,
  | "id"
  | "createdAt"
  | " updatedAt"
  | "passwordResetToken"
  | "passwordResetTokenExpiresAt"
  | "computedLocation"
  | "activationToken"
  | "activationTokenExpiresAt"
>;
