import { Test, TestingModule } from '@nestjs/testing';
import { LogoutHandler } from './logout.handler';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/ports/refresh-token.repository.port';
import { LogoutCommand } from './logout.command';

describe('LogoutHandler', () => {
  let handler: LogoutHandler;
  let refreshTokenRepository: { deleteByUserId: jest.Mock };

  beforeEach(async () => {
    refreshTokenRepository = {
      deleteByUserId: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutHandler,
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepository },
      ],
    }).compile();

    handler = module.get<LogoutHandler>(LogoutHandler);
  });

  it('debe eliminar tokens y retornar mensaje de éxito', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    const result = await handler.execute(new LogoutCommand(userId));

    expect(result).toEqual({ message: 'Logged out successfully' });
    expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(userId);
  });
});
