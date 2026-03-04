import { Injectable } from '@nestjs/common';
import { ValidateTokenCommand } from './validate-token.command';

@Injectable()
export class ValidateTokenHandler {
  async execute(command: ValidateTokenCommand) {
    return {
      userId: command.userId,
      email: command.email,
      isActive: command.isActive,
      roles: command.roles,
      apps: command.apps,
    };
  }
}
