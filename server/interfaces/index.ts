import { IUser, IUserSignUp } from "@/types/user.types";
import { IEmailOptions } from "@/types/utils.types";

interface ServiceResponse<T = unknown> {
  success: boolean;
  msg?: string;
  data?: T;
}

export interface IAuthService {
  signup(data: IUserSignUp): Promise<ServiceResponse<Partial<IEmailOptions>>>;
  activateAccount(token: string): Promise<Omit<ServiceResponse, "data">>;
  login(email: string, password: string): Promise<ServiceResponse<string>>;
  forgotPassword(email: string): Promise<ServiceResponse<IEmailOptions>>;
  resetPassword(
    resetToken: string,
    pwd: string
  ): Promise<ServiceResponse<unknown>>;
}
