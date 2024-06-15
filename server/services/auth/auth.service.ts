import { ICurrentUser } from './../../interfaces/user.interface';
import { TokenService } from './token.service';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import Logger from 'bunyan';
import dayjs from 'dayjs';

import { createLogger, hashGenerator } from '@/utils/index';
import { IEmailOptions } from '@/interfaces/utils.interface';
import { IUser, IUserSignUp } from '@/interfaces/user.interface';
import { IAuthService } from '@/interfaces';
import { db } from '@/db';

class AuthService implements IAuthService {
  prisma: PrismaClient;
  private logger: Logger;
  private tokenService: TokenService;

  private excludedFields = [
    'password',
    'passwordResetToken',
    'passwordResetTokenExpiresAt',
    'computedLocation',
    'activationToken',
    'activationTokenExpiresAt',
  ];

  constructor() {
    this.prisma = db.getClient();
    this.tokenService = new TokenService();
    this.logger = createLogger('AuthService');
  }

  signup = async (data: IUserSignUp) => {
    try {
      const user = await this.prisma.user.create({
        data: {
          ...data,
          activationToken: hashGenerator(),
          dob: data.dob ? new Date(data.dob) : '',
          password: await this.hashPassword(data.password),
          activationTokenExpiresAt: dayjs().add(1, 'hour').toDate(),
        },
      });

      // SEND EMAIL WITH ACTIVATION LINK
      const emailOptions: IEmailOptions = {
        subject: 'Activate your account',
        to: user.email,
        data: {
          fullname: `${user.firstName} ${user.lastName}`,
          activationUrl: `${process.env.FRONTEND_URL}/account_activation/${user.activationToken}`,
        },
        emailType: 'USER_REGISTRATION',
      };

      return {
        success: true,
        data: emailOptions,
        msg: 'Check your email for your account activation link.',
      };
    } catch (error) {
      this.logger.error('Auth service error: ', error);
      throw error;
    }
  };

  activateAccount = async (token: string) => {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          activationToken: token.trim(),
          activationTokenExpiresAt: { gte: new Date() },
        },
      });

      if (!user) {
        const msg = 'Activation link is invalid.';
        this.logger.error('Auth service error: ', msg);
        // throw new ErrorResponse(msg, 422, 'authServiceError');
        throw new Error(msg);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
          activationToken: '',
          activationTokenExpiresAt: null,
        },
      });

      return {
        success: true,
        msg: 'Account has been activated.',
      };
    } catch (error) {
      this.logger.error('Auth service error: ', error);
      throw error;
    }
  };

  login = async (email: string, password: string) => {
    try {
      const user = await this.prisma.user.findFirst({ where: { email } });

      if (!user) {
        const err = 'Invalid email/password credentials1.';
        this.logger.error('Auth service error: ', err);
        throw new Error(err);
      }

      const isMatch = await this.validatePassword(password, user.password);
      if (!isMatch) {
        const err = 'Invalid email/password credentials.';
        this.logger.error('Auth service error: ', err);
        throw new Error(err);
      }

      const jwt = this.tokenService.createAccessToken(user.id);
      const refreshToken = this.tokenService.createRefreshToken(user.id);
      const currentuser = this.generateCurrentUserObject(user);

      return { success: true, data: { user: currentuser, jwt, refreshToken } };
    } catch (error) {
      this.logger.error('Auth service error: ', error);
      throw error;
    }
  };

  forgotPassword = async (email: string) => {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      const oneHour = dayjs().add(1, 'hour').toDate();

      if (!user) {
        const err = 'Invalid email credentials provided.';
        this.logger.error('Auth service error: ', err);
        throw new Error(err);
      }

      // SEND EMAIL
      const emailOptions: IEmailOptions = {
        subject: 'Account Password Reset',
        to: user.email,
        data: {
          fullname: `${user.firstName} ${user.lastName}`,
          resetPasswordUrl: `${process.env.FRONTEND_URL}/reset_password/${user.passwordResetToken}`,
        },
        emailType: 'FORGOT_PASSWORD',
      };

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashGenerator(),
          passwordResetTokenExpiresAt: oneHour,
        },
      });

      return {
        success: true,
        data: emailOptions,
        msg: 'Password reset link has been sent to your inbox.',
      };
    } catch (error) {
      this.logger.error('Auth service error: ', error);
      throw error;
    }
  };

  resetPassword = async (resetToken: string, password: string) => {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetToken: resetToken,
          passwordResetTokenExpiresAt: {
            gte: new Date(),
          },
        },
      });

      if (!user) {
        this.logger.error('Token is invalid or expired');
        throw new Error('Token is invalid or expired');
      }

      // SEND EMAIL
      const emailOptions = {
        subject: 'Password Reset Successful',
        to: user.email,
        data: {
          fullname: `${user.firstName} ${user.lastName}`,
          resetAt: dayjs().format('DD/MM/YYYY H:m:s'),
        },
        emailType: 'RESET_PASSWORD_SUCCESS',
      };

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: '',
          passwordResetTokenExpiresAt: '',
          password: await this.hashPassword(password),
        },
      });

      return {
        success: true,
        data: emailOptions,
        msg: 'Your password was successfully updated.',
      };
    } catch (error) {
      this.logger.error('Auth service error: ', error);
      throw error;
    }
  };

  private hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password as string, salt);
  };

  private validatePassword = async (pwd: string, hashedPwd: string): Promise<boolean> => {
    if (!pwd || !hashedPwd) {
      return false;
    }

    return await bcrypt.compare(pwd, hashedPwd);
  };

  private generateCurrentUserObject = (user: User) => {
    return {
      id: user.id,
      dob: user.dob?.toISOString(),
      email: user.email,
      lastName: user.lastName,
      isActive: user.isActive,
      avatar: user.avatar ?? '',
      firstName: user.firstName,
      location: user.location ?? '',
      fullname: `${user.firstName} ${user.lastName}`,
    } as ICurrentUser;
  };
}

export const authService = new AuthService();
