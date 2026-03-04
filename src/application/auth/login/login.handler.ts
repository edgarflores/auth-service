import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/auth/ports/user.repository.port';
import type { IUserRepository } from '../../../domain/auth/ports/user.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/ports/refresh-token.repository.port';
import type { IRefreshTokenRepository } from '../../../domain/auth/ports/refresh-token.repository.port';
import { PASSWORD_HASHER } from '../../../domain/auth/ports/password-hasher.port';
import type { IPasswordHasher } from '../../../domain/auth/ports/password-hasher.port';
import { TOKEN_SERVICE } from '../../../domain/auth/ports/token.service.port';
import type { ITokenService } from '../../../domain/auth/ports/token.service.port';
import { InvalidCredentialsError } from '../../../domain/auth/errors/auth-domain.errors';
import { REFRESH_TOKEN_DAYS } from '../../../domain/auth/auth.constants';
import { LoginCommand } from './login.command';

@Injectable()
export class LoginHandler {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LoginCommand): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await user.hasValidPassword(
      command.password,
      this.passwordHasher.compare.bind(this.passwordHasher),
    );
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new InvalidCredentialsError();
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
