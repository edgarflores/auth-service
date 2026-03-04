import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/auth/ports/user.repository.port';
import type { IUserRepository } from '../../../domain/auth/ports/user.repository.port';
import { PASSWORD_HASHER } from '../../../domain/auth/ports/password-hasher.port';
import type { IPasswordHasher } from '../../../domain/auth/ports/password-hasher.port';
import { EmailAlreadyExistsError } from '../../../domain/auth/errors/auth-domain.errors';
import { RegisterCommand } from './register.command';

@Injectable()
export class RegisterHandler {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: RegisterCommand): Promise<void> {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new EmailAlreadyExistsError(command.email);
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    await this.userRepository.save({
      email: command.email,
      passwordHash,
    });
  }
}
