import { AppCache } from "@services/redis/cache/app.cache";

class RedisConnection extends AppCache {
  constructor() {
    super("redisConnection");
  }

  async connect(): Promise<void> {
    try {
      this.client.connect();
      this.client.on("connect", () => {
        this.log.info(`Redis connection established`);
      });
    } catch (error) {
      this.log.error(error);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
