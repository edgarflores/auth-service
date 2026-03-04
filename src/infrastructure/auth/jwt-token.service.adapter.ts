import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenService, TokenPayload } from '../../domain/auth/ports/token.service.port';

const ACCESS_TOKEN_TTL_SECONDS = 900; // 15 min; override via JWT_ACCESS_TTL in JwtModule config if needed

@Injectable()
export class JwtTokenServiceAdapter implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  }

  generateRefreshTokenValue(): string {
    return crypto.randomUUID();
  }
}
