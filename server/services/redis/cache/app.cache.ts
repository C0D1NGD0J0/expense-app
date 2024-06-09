import { createClient } from "redis";
import Logger from "bunyan";

import { createLogger } from "@/utils";

export type RedisClient = ReturnType<typeof createClient>;

type ICacheReturnType = string | null;

type ICacheResponse = {
  success: boolean;
  data?: ICacheReturnType;
};

export abstract class AppCache {
  client: RedisClient;
  log: Logger;

  constructor(cacheName: string) {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
    this.log = createLogger(cacheName);
    this.cacheError();
  }

  set = async (
    key: string,
    value: string,
    ttl = 120
  ): Promise<ICacheResponse> => {
    try {
      await this.client.SETEX(key, ttl, value);
      return { success: true };
    } catch (error) {
      this.log.error(error.message);
      throw error;
    }
  };

  get = async (key: string): Promise<ICacheResponse> => {
    try {
      const data = await this.client.GET(key);
      return { success: true, data };
    } catch (error) {
      this.log.error(error.message);
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
      throw error;
    }
  };

  remove = async (key: string): Promise<ICacheResponse> => {
    try {
      const resp = await this.client.del(key);
      return { success: true };
    } catch (error) {
      this.log.error(error);
      throw error;
    }
  };

  private cacheError(): void {
    this.client.on("error", (err: unknown) => {
      this.log.error(err);
    });
  }
}
