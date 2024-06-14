import { createClient } from 'redis';
import Logger from 'bunyan';

import { createLogger } from '@utils/index';
import { ICacheResponse } from '@/interfaces';

export type RedisClient = ReturnType<typeof createClient>;

interface IBaseCache {
  client: RedisClient;
  log: Logger;
  // setItem(key: string, value: unknown, ttl?: number): Promise<ICacheResponse>;
  // getItem(key: string): Promise<ICacheResponse>;
  // deleteItems(keys: string[]): Promise<ICacheResponse>;
}

export abstract class BaseCache implements IBaseCache {
  client: RedisClient;
  log: Logger;

  constructor(cacheName: string) {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
    this.log = createLogger(cacheName);
    this.cacheError();
  }

  protected setItem = async (key: string, value: unknown, ttl?: number) => {
    try {
      let result;
      if (!ttl) {
        result = await this.client.SET(key, JSON.stringify(value));
        return { success: result === 'OK' };
      }

      result = await this.client.SETEX(key, ttl, JSON.stringify(value));
      return { success: result === 'OK' };
    } catch (error) {
      return false;
    }
  };

  protected getItem = async (key: string): Promise<ICacheResponse> => {
    try {
      const res = await this.client.GET(key);
      if (res) {
        const isJson = this.isJsonString(res);
        return {
          success: true,
          data: isJson ? JSON.parse(res) : res,
        };
      }

      return {
        success: false,
        data: null,
      };
    } catch (error) {
      this.log.error((error as Error).message);
      return false;
    }
  };

  protected deleteItems = async (keys: string[]): Promise<ICacheResponse> => {
    try {
      await this.client.del(keys);
      return { success: true };
    } catch (error) {
      this.log.error((error as Error).message);
      return false;
    }
  };

  private cacheError(): void {
    this.client.on('error', (err: unknown) => {
      this.log.error(err);
    });
  }

  private isJsonString(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
}
