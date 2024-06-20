import { TokenType } from '@/interfaces';
import { ACCESS_TOKEN, REFRESH_TOKEN, createLogger } from '@/utils';
import jwt from 'jsonwebtoken';
import Logger from 'bunyan';
interface JwtOptions {
  expiresIn: string | number;
}

export class TokenService {
  private logger: Logger;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private jwtExpiresIn: string | number;
  private jwtRefreshExpiresIn: string | number;

  constructor() {
    this.logger = createLogger('TokenService');
    this.jwtExpiresIn = process.env.JWT_EXPIREIN || '2h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRESIN || '1d';
    this.jwtSecret = process.env.JWT_SECRET || 'defaultAccessTokenSecret';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'defaultRefreshTokenSecret';
  }

  createJwtTokens = (userId: string) => {
    const at = this.generateToken(userId, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
    const rt = this.generateToken(userId, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
    });

    return {
      accessToken: at,
      refreshToken: rt,
    };
  };

  decodeJwt = (token: string) => {
    if (!token) {
      return { success: false };
    }

    const resp = jwt.decode(token);
    if (!resp) {
      return { success: false };
    }

    return {
      success: true,
      data: resp as {
        userId: string;
        iat: number;
        exp: number;
      },
    };
  };

  verifyJwtToken = async (tokenType: TokenType, token: string) => {
    if (tokenType !== ACCESS_TOKEN && tokenType !== REFRESH_TOKEN) {
      return { success: false };
    }
    try {
      let resp;
      if (tokenType === REFRESH_TOKEN) {
        resp = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
        return { success: true, data: resp };
      }

      if (tokenType === ACCESS_TOKEN) {
        resp = jwt.verify(token, process.env.JWT_SECRET as string);
        return { success: true, data: resp };
      }

      return { success: false };
    } catch (error) {
      this.logger.error('JWT verification failed: ', (error as Error).message);
      return { success: false };
    }
  };

  private generateToken(userId: string, secret: string, options: JwtOptions): string {
    return jwt.sign({ userId }, secret, options);
  }
}

export const tokenService = new TokenService();
