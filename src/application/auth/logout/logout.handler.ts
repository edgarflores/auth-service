import { Inject, Injectable } from '@nestjs/common';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/ports/refresh-token.repository.port';
import type { IRefreshTokenRepository } from '../../../domain/auth/ports/refresh-token.repository.port';
import { LogoutCommand } from './logout.command';

@Injectable()
export class LogoutHandler {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<{ message: string }> {
    await this.refreshTokenRepository.deleteByUserId(command.userId);
    return { message: 'Logged out successfully' };
  }
}
