import { PrismaClient } from '@prisma/client';
import Logger from 'bunyan';

import { redisConnection } from '@/caching/redis/config';
import { createLogger } from '@utils/index';
class Database {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor() {
    this.logger = createLogger('DatabseConfig');
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL || '' },
      },
    });
    redisConnection.connect();
  }

  async connectToRedis(): Promise<boolean> {
    try {
      await redisConnection.connect();
      return true;
    } catch (error) {
      this.logger.error('Redis connection error: ', error);
      return false;
    }
  }

  async isDbConnected(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.info('Connected to DB...');
      return true;
    } catch (error) {
      this.logger.error('Database connection failed', error);
      return false;
    }
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const db = new Database();
