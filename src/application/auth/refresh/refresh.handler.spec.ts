import { Test, TestingModule } from '@nestjs/testing';
import { RefreshHandler } from './refresh.handler';
import { USER_REPOSITORY } from '../../../domain/auth/ports/user.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/ports/refresh-token.repository.port';
import { PASSWORD_HASHER } from '../../../domain/auth/ports/password-hasher.port';
import { TOKEN_SERVICE } from '../../../domain/auth/ports/token.service.port';
import { User } from '../../../domain/auth/user.entity';
import { PasswordHash } from '../../../domain/auth/value-objects/password-hash.vo';
import { RefreshToken } from '../../../domain/auth/refresh-token.entity';
import { RefreshTokenInvalidError, UserNotFoundError } from '../../../domain/auth/errors/auth-domain.errors';
import { RefreshCommand } from './refresh.command';

const mockUser = User.create({
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  passwordHash: PasswordHash.create('hashedPassword'),
  isActive: true,
  roles: ['user'],
  apps: ['ledgerflow'],
});

describe('RefreshHandler', () => {
  let handler: RefreshHandler;
  let userRepository: { findById: jest.Mock };
  let refreshTokenRepository: {
    findByUserId: jest.Mock;
    deleteById: jest.Mock;
    save: jest.Mock;
  };
  let passwordHasher: { compare: jest.Mock; hash: jest.Mock };
  let tokenService: { signAccessToken: jest.Mock; generateRefreshTokenValue: jest.Mock };

  beforeEach(async () => {
    userRepository = { findById: jest.fn().mockResolvedValue(mockUser) };
    refreshTokenRepository = {
      findByUserId: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue({}),
    };
    passwordHasher = {
      compare: jest.fn().mockResolvedValue(true),
      hash: jest.fn().mockResolvedValue('hashedRefresh'),
    };
    tokenService = {
      signAccessToken: jest.fn().mockResolvedValue('mockAccessToken'),
      generateRefreshTokenValue: jest.fn().mockReturnValue('uuid-refresh-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshHandler,
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepository },
        { provide: PASSWORD_HASHER, useValue: passwordHasher },
        { provide: TOKEN_SERVICE, useValue: tokenService },
      ],
    }).compile();

    handler = module.get<RefreshHandler>(RefreshHandler);
  });

  it('debe retornar nuevos tokens y revocar el anterior con token válido', async () => {
    const validToken = RefreshToken.create({
      id: 'token-id-1',
      userId: mockUser.id,
      tokenHash: 'hashedToken',
      expiresAt: new Date(Date.now() + 86400000),
    });
    refreshTokenRepository.findByUserId.mockResolvedValue([validToken]);

    const result = await handler.execute(
      new RefreshCommand(mockUser.id, 'valid-refresh-token-uuid'),
    );

    expect(result).toEqual({
      accessToken: 'mockAccessToken',
      refreshToken: 'uuid-refresh-token',
    });
    expect(refreshTokenRepository.deleteById).toHaveBeenCalledWith('token-id-1');
    expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
    expect(refreshTokenRepository.save).toHaveBeenCalled();
  });

  it('debe lanzar RefreshTokenInvalidError cuando el refresh token es inválido', async () => {
    const validToken = RefreshToken.create({
      id: 'token-id-1',
      userId: mockUser.id,
      tokenHash: 'hashedToken',
      expiresAt: new Date(Date.now() + 86400000),
    });
    refreshTokenRepository.findByUserId.mockResolvedValue([validToken]);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      handler.execute(new RefreshCommand(mockUser.id, 'invalid-refresh-token')),
    ).rejects.toThrow(RefreshTokenInvalidError);
  });

  it('debe lanzar RefreshTokenInvalidError cuando no hay tokens', async () => {
    refreshTokenRepository.findByUserId.mockResolvedValue([]);

    await expect(
      handler.execute(new RefreshCommand(mockUser.id, 'any-token')),
    ).rejects.toThrow(RefreshTokenInvalidError);
  });

  it('debe lanzar RefreshTokenInvalidError cuando el token está expirado', async () => {
    const expiredToken = RefreshToken.create({
      id: 'token-id-1',
      userId: mockUser.id,
      tokenHash: 'hashedToken',
      expiresAt: new Date(Date.now() - 86400000),
    });
    refreshTokenRepository.findByUserId.mockResolvedValue([expiredToken]);
    passwordHasher.compare.mockResolvedValue(true);

    await expect(
      handler.execute(new RefreshCommand(mockUser.id, 'expired-refresh-token')),
    ).rejects.toThrow(RefreshTokenInvalidError);
  });

  it('debe lanzar UserNotFoundError cuando el usuario no existe', async () => {
    const validToken = RefreshToken.create({
      id: 'token-id-1',
      userId: mockUser.id,
      tokenHash: 'hashedToken',
      expiresAt: new Date(Date.now() + 86400000),
    });
    refreshTokenRepository.findByUserId.mockResolvedValue([validToken]);
    userRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new RefreshCommand(mockUser.id, 'valid-token')),
    ).rejects.toThrow(UserNotFoundError);
  });
});
