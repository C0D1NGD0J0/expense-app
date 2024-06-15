import { BaseCache, RedisClient } from '@/caching';

interface IRedisConnection {
  /** Connects to redis database */
  connect(): Promise<void>;
  /** Returns instance of redis connection */
  getRedisInstance(): RedisClient;
}

class RedisConnection extends BaseCache implements IRedisConnection {
  constructor() {
    super('RedisConnection');
  }

  async connect() {
    try {
      await this.client.connect();
      this.client.on('connect', () => {
        this.log.info('Redis connection established');
      });
    } catch (error) {
      this.log.error(error);
    }
  }

  getRedisInstance(): RedisClient {
    return this.client;
  }
}

export const redisConnection = new RedisConnection();
