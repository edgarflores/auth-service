import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/auth/ports/user.repository.port';
import type { IUserRepository } from '../../../domain/auth/ports/user.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/ports/refresh-token.repository.port';
import type { IRefreshTokenRepository } from '../../../domain/auth/ports/refresh-token.repository.port';
import { PASSWORD_HASHER } from '../../../domain/auth/ports/password-hasher.port';
import type { IPasswordHasher } from '../../../domain/auth/ports/password-hasher.port';
import { TOKEN_SERVICE } from '../../../domain/auth/ports/token.service.port';
import type { ITokenService } from '../../../domain/auth/ports/token.service.port';
import {
  RefreshTokenInvalidError,
  UserNotFoundError,
} from '../../../domain/auth/errors/auth-domain.errors';
import { REFRESH_TOKEN_DAYS } from '../../../domain/auth/auth.constants';
import { RefreshToken } from '../../../domain/auth/refresh-token.entity';
import { RefreshCommand } from './refresh.command';

@Injectable()
export class RefreshHandler {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: RefreshCommand): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.refreshTokenRepository.findByUserId(command.userId);
    const now = new Date();

    let validToken: RefreshToken | null = null;
    for (const t of tokens) {
      const match = await this.passwordHasher.compare(command.refreshToken, t.tokenHash);
      if (match && !t.isExpired(now)) {
        validToken = t;
        break;
      }
    }

    if (!validToken) {
      throw new RefreshTokenInvalidError();
    }

    await this.refreshTokenRepository.deleteById(validToken.id);

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundError(command.userId);
    }

    const payload = user.toTokenPayload();
    const accessToken = await this.tokenService.signAccessToken(payload);
    const refreshTokenValue = this.tokenService.generateRefreshTokenValue();
    const refreshHash = await this.passwordHasher.hash(refreshTokenValue);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS);
    await this.refreshTokenRepository.save({
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }
}
