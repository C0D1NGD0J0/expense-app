import { PrismaClient } from '@prisma/client';

import { createLogger, generateCurrentUserObject } from '@/utils/index';
import { ServiceResponse } from '@interfaces/utils.interface';
import { ICurrentUser } from '@interfaces/user.interface';
import { db } from '@/db';

interface IUserService {
  getCurrentUser(userid: string): Promise<ServiceResponse<ICurrentUser | null>>;
}

class UserService implements IUserService {
  private log;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = db.getClient();
    this.log = createLogger('UserService');
  }

  getCurrentUser = async (userId: string) => {
    if (!userId) {
      const err = 'Something went wrong, please try again.';
      this.log.error(err);
      return { success: false, data: null };
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, isActive: true },
      });

      if (!user) {
        this.log.error('user not found in db with id: ', userId);
        throw new Error('User not found.');
      }
      const currentuser = generateCurrentUserObject(user);
      return { success: true, data: currentuser };
    } catch (error) {
      this.log.error(error);
      throw new Error((error as Error).message);
    }
  };
}

export const userService = new UserService();
