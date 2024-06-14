import { ICacheResponse, ICurrentUser } from '@/interfaces';
import { BaseCache } from './app.cache';

export class AuthCache extends BaseCache {
  private authPrefix = 'authTokens';

  constructor() {
    super('authCache');
  }

  saveAuthTokens = async (userid: string, tokens: [string, string]): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (!this.isValidTokensArray(tokens)) {
        this.log.error('Error adding tokens to cache.');
        return false;
      }

      // tokens is array of jwt-token
      // tokens[0] = accessToken
      // tokena[1] = refreshToken
      const key = `${this.authPrefix}:${userid}`;
      const [accessToken, refreshToken] = tokens;
      const pipeline = this.client.multi();
      // Get expiration for the tokens
      const refreshTokenTTL = parseInt(process.env.REFRESH_TOKEN_TTL as string); // e.g., 86400 for 24 hours
      pipeline.hSet(key, { accessToken, refreshToken });
      // Set expiration for the hash key using the refresh token's TTL
      pipeline.expire(key, refreshTokenTTL);

      await pipeline.exec();

      return { success: true };
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      return false;
    }
  };

  getAuthTokens = async (userId: string): Promise<ICacheResponse<string[]>> => {
    try {
      const tokens = await this.client.hGetAll(`${this.authPrefix}:${userId}`);
      if (!tokens.accessToken || !tokens.refreshToken) {
        return { success: false };
      }
      return { success: true, data: [tokens.accessToken, tokens.refreshToken] };
    } catch (error) {
      this.log.error('Error fetching auth tokens from cache:', error);
      return { success: false };
    }
  };

  delAuthTokens = async (userId: string): Promise<ICacheResponse> => {
    try {
      await this.client.del(`${this.authPrefix}:${userId}`);
      return { success: true };
    } catch (error) {
      this.log.error('Error deleting auth tokens from cache:', error);
      return { success: false };
    }
  };

  saveCurrentUser = async (data: ICurrentUser): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const key = `currentuser:${data.id}`;
      await this.setItem(key, data, parseInt(process.env.REFRESH_TOKEN_TTL as string));
      return { success: true };
    } catch (error) {
      this.log.error('Error saving user to cache:', error);
      return { success: false };
    }
  };

  getCurrentUser = async (userId: string): Promise<ICacheResponse<ICurrentUser>> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const key = `currentuser:${userId}`;
      const resp = await this.getItem(key);
      console.log(resp, '=====resp======');
      return { success: true };
    } catch (error) {
      this.log.error('Auth cache error: ', error);
      return { success: false };
    }
  };

  logoutUser = async (userId: string): Promise<ICacheResponse> => {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const currentUserKey = `currentuser:${userId}`;
      const authTokenKey = `${this.authPrefix}:${userId}`;

      await this.deleteItems([currentUserKey, authTokenKey]);

      return { success: true };
    } catch (error) {
      this.log.error('Auth cache logout error: ', error);
      return { success: false };
    }
  };

  private isValidTokensArray = (tokens: string[]): boolean => {
    const isJwt = (token: string): boolean => {
      const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
      return jwtRegex.test(token);
    };

    if (!Array.isArray(tokens) || tokens.length !== 2) {
      return false;
    }

    const [accessToken, refreshToken] = tokens;
    return isJwt(accessToken) && isJwt(refreshToken);
  };
}

export const authCache = new AuthCache();
