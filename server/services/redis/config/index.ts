import { AppCache, RedisClient } from "@services/redis/cache/app.cache";

interface IRedisConnection {
  /** Connects to redis database */
  connect(): Promise<void>;
}

class RedisConnection extends AppCache implements IRedisConnection {
  constructor() {
    super("RedisConnection");
  }

  async connect() {
    try {
      this.client.connect();
      this.client.on("connect", () => {
        this.log.info(`Redis connection established`);
      });
    } catch (error) {
      this.log.error(error);
    }
  }

  getRedisInstance(): RedisClient {
    return this.client;
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
