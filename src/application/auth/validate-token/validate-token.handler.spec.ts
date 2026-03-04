import { Test, TestingModule } from '@nestjs/testing';
import { ValidateTokenHandler } from './validate-token.handler';
import { ValidateTokenCommand } from './validate-token.command';

describe('ValidateTokenHandler', () => {
  let handler: ValidateTokenHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidateTokenHandler],
    }).compile();

    handler = module.get<ValidateTokenHandler>(ValidateTokenHandler);
  });

  it('debe retornar userId, email, isActive, roles y apps del payload', async () => {
    const command = new ValidateTokenCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      'user@example.com',
      true,
      ['user'],
      ['ledgerflow'],
    );

    const result = await handler.execute(command);

    expect(result).toEqual({
      userId: command.userId,
      email: command.email,
      isActive: command.isActive,
      roles: command.roles,
      apps: command.apps,
    });
  });
});
