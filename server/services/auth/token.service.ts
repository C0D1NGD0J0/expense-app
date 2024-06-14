import jwt from 'jsonwebtoken';

interface JwtOptions {
  expiresIn: string | number;
}

export class TokenService {
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private jwtExpiresIn: string | number;
  private jwtRefreshExpiresIn: string | number;

  constructor() {
    this.jwtExpiresIn = process.env.JWT_EXPIREIN || '2h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRESIN || '1d';
    this.jwtSecret = process.env.JWT_SECRET || 'defaultAccessTokenSecret';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'defaultRefreshTokenSecret';
  }

  createAccessToken(userId: string): string {
    return this.generateToken(userId, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  createRefreshToken(userId: string): string {
    return this.generateToken(userId, this.jwtRefreshSecret, { expiresIn: this.jwtRefreshExpiresIn });
  }

  private generateToken(userId: string, secret: string, options: JwtOptions): string {
    return jwt.sign({ userId }, secret, options);
  }
}
