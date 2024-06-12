import { createClient } from 'redis';
import Logger from 'bunyan';

import { createLogger } from '@utils/index';

export type RedisClient = ReturnType<typeof createClient>;

type ICacheReturnType = string | null;

type ICacheResponse = {
  success: boolean;
  data?: ICacheReturnType;
};

interface IAppCache {
  client: RedisClient;
  log: Logger;
  get(key: string): Promise<ICacheResponse>;
  set(key: string, value: string, ttl?: number): Promise<ICacheResponse>;
  setObject(key: string, value: unknown, ttl?: number): Promise<ICacheResponse>;
  getObject(key: string): Promise<ICacheResponse | null>;
  delete(key: string): Promise<ICacheResponse>;
}

export abstract class AppCache implements IAppCache {
  client: RedisClient;
  log: Logger;

  constructor(cacheName: string) {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
    this.log = createLogger(cacheName);
    this.cacheError();
  }

  get = async (key: string): Promise<ICacheResponse> => {
    try {
      const data = await this.client.GET(key);
      return { success: true, data };
    } catch (error) {
      this.log.error((error as Error).message);
      throw error;
    }
  };

  set = async (key: string, value: string, ttl = 120): Promise<ICacheResponse> => {
    try {
      await this.client.SETEX(key, ttl, value);
      return { success: true };
    } catch (error) {
      this.log.error((error as Error).message);
      throw error;
    }
  };

  setObject = async (key: string, value: unknown, ttl?: number) => {
    return this.set(key, JSON.stringify(value), ttl);
  };

  getObject = async (key: string): Promise<ICacheResponse | null> => {
    try {
      const res = await this.get(key);
      if (res.success) {
        return {
          success: true,
          data: JSON.parse(res.data as string),
        };
      }
      return null;
    } catch (error) {
      this.log.error((error as Error).message);
      throw error;
    }
  };

  delete = async (key: string): Promise<ICacheResponse> => {
    try {
      const resp = await this.client.del(key);
      return { success: true };
    } catch (error) {
      this.log.error((error as Error).message);
      throw error;
    }
  };

  private cacheError(): void {
    this.client.on('error', (err: unknown) => {
      this.log.error(err);
    });
  }
}
