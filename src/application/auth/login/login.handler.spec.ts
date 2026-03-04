import { Test, TestingModule } from '@nestjs/testing';
import { LoginHandler } from './login.handler';
import { USER_REPOSITORY } from '../../../domain/auth/ports/user.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/ports/refresh-token.repository.port';
import { PASSWORD_HASHER } from '../../../domain/auth/ports/password-hasher.port';
import { TOKEN_SERVICE } from '../../../domain/auth/ports/token.service.port';
import { User } from '../../../domain/auth/user.entity';
import { PasswordHash } from '../../../domain/auth/value-objects/password-hash.vo';
import { InvalidCredentialsError } from '../../../domain/auth/errors/auth-domain.errors';
import { LoginCommand } from './login.command';

const mockUser = User.create({
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  passwordHash: PasswordHash.create('hashedPassword'),
  isActive: true,
  roles: ['user'],
  apps: ['ledgerflow'],
});

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userRepository: { findByEmail: jest.Mock };
  let passwordHasher: { compare: jest.Mock; hash: jest.Mock };
  let tokenService: { signAccessToken: jest.Mock; generateRefreshTokenValue: jest.Mock };
  let refreshTokenRepository: { save: jest.Mock };

  beforeEach(async () => {
    userRepository = { findByEmail: jest.fn() };
    passwordHasher = {
      compare: jest.fn().mockResolvedValue(true),
      hash: jest.fn().mockResolvedValue('hashedRefresh'),
    };
    tokenService = {
      signAccessToken: jest.fn().mockResolvedValue('mockAccessToken'),
      generateRefreshTokenValue: jest.fn().mockReturnValue('uuid-refresh-token'),
    };
    refreshTokenRepository = { save: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginHandler,
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepository },
        { provide: PASSWORD_HASHER, useValue: passwordHasher },
        { provide: TOKEN_SERVICE, useValue: tokenService },
      ],
    }).compile();

    handler = module.get<LoginHandler>(LoginHandler);
  });

  it('debe retornar accessToken y refreshToken con credenciales válidas', async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser);

    const result = await handler.execute(
      new LoginCommand('user@example.com', 'password123'),
    );

    expect(result).toEqual({
      accessToken: 'mockAccessToken',
      refreshToken: 'uuid-refresh-token',
    });
    expect(userRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'password123',
      'hashedPassword',
    );
    expect(tokenService.signAccessToken).toHaveBeenCalledWith({
      sub: mockUser.id,
      email: mockUser.email,
      isActive: mockUser.isActive,
      roles: ['user'],
      apps: ['ledgerflow'],
    });
    expect(refreshTokenRepository.save).toHaveBeenCalled();
  });

  it('debe lanzar InvalidCredentialsError cuando el email no existe', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(new LoginCommand('nonexistent@example.com', 'password123')),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('debe lanzar InvalidCredentialsError cuando la contraseña es incorrecta', async () => {
    userRepository.findByEmail.mockResolvedValue(mockUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      handler.execute(new LoginCommand('user@example.com', 'wrongpassword')),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('debe lanzar InvalidCredentialsError cuando el usuario está inactivo', async () => {
    const inactiveUser = User.create({
      id: mockUser.id,
      email: mockUser.email,
      passwordHash: PasswordHash.create('hashedPassword'),
      isActive: false,
      roles: ['user'],
      apps: ['ledgerflow'],
    });
    userRepository.findByEmail.mockResolvedValue(inactiveUser);

    await expect(
      handler.execute(new LoginCommand('user@example.com', 'password123')),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
