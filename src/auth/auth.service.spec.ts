import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-tokens.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();
const mockBcryptGenSalt = jest.fn();

jest.mock('bcrypt', () => ({
  compare: (...args: unknown[]) => mockBcryptCompare(...args),
  hash: (...args: unknown[]) => mockBcryptHash(...args),
  genSalt: (...args: unknown[]) => mockBcryptGenSalt(...args),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let refreshTokenRepository: {
    find: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };

  const mockUser: Partial<User> = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    password: 'hashedPassword',
    isActive: true,
  };

  beforeEach(async () => {
    mockBcryptCompare.mockResolvedValue(true);
    mockBcryptHash.mockResolvedValue('hashedToken');
    mockBcryptGenSalt.mockResolvedValue('salt');

    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    refreshTokenRepository = {
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mockAccessToken'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: refreshTokenRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('debe retornar accessToken y refreshToken con credenciales válidas', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      refreshTokenRepository.save.mockResolvedValue({});

      const result = await service.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: expect.any(String),
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id },
        { expiresIn: '15m' },
      );
    });

    it('debe lanzar UnauthorizedException cuando el email no existe', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid credentials!!');
    });

    it('debe lanzar UnauthorizedException cuando la contraseña es incorrecta', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login({
          email: 'user@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow('Invalid credentials!!');
    });
  });

  describe('register', () => {
    it('debe guardar usuario con datos válidos', async () => {
      const dto: AuthCredentialsDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };
      userRepository.create.mockReturnValue({
        email: dto.email,
        password: 'hashedPassword',
      });
      userRepository.save.mockResolvedValue({});

      await service.register(dto);

      expect(userRepository.create).toHaveBeenCalledWith({
        email: dto.email,
        password: expect.any(String),
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar InternalServerErrorException cuando email está vacío', async () => {
      await expect(
        service.register({
          email: '',
          password: 'password123',
        }),
      ).rejects.toThrow('email and password can not be empty!');
    });

    it('debe lanzar InternalServerErrorException cuando password está vacío', async () => {
      await expect(
        service.register({
          email: 'user@example.com',
          password: '',
        }),
      ).rejects.toThrow('email and password can not be empty!');
    });

    it('debe lanzar InternalServerErrorException cuando el email ya existe', async () => {
      userRepository.create.mockReturnValue({});
      userRepository.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.register({
          email: 'existing@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Email existing@example.com already exists!!');
    });
  });

  describe('refresh', () => {
    const validRefreshToken = {
      id: 'token-id-1',
      userId: mockUser.id,
      tokenHash: 'hashedToken',
      expiresAt: new Date(Date.now() + 86400000),
    };

    it('debe retornar nuevos tokens y revocar el anterior con token válido', async () => {
      refreshTokenRepository.find.mockResolvedValue([validRefreshToken]);
      refreshTokenRepository.delete.mockResolvedValue({});
      refreshTokenRepository.save.mockResolvedValue({});

      const result = await service.refresh(
        mockUser.id!,
        'valid-refresh-token-uuid',
      );

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: expect.any(String),
      });
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        id: validRefreshToken.id,
      });
    });

    it('debe lanzar UnauthorizedException cuando el refresh token es inválido', async () => {
      refreshTokenRepository.find.mockResolvedValue([validRefreshToken]);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        service.refresh(mockUser.id!, 'invalid-refresh-token'),
      ).rejects.toThrow('Refresh token invalid or expired');
    });

    it('debe lanzar UnauthorizedException cuando no hay tokens para el usuario', async () => {
      refreshTokenRepository.find.mockResolvedValue([]);

      await expect(
        service.refresh(mockUser.id!, 'any-token'),
      ).rejects.toThrow('Refresh token invalid or expired');
    });

    it('debe lanzar UnauthorizedException cuando el token está expirado', async () => {
      const expiredToken = {
        ...validRefreshToken,
        expiresAt: new Date(Date.now() - 86400000),
      };
      refreshTokenRepository.find.mockResolvedValue([expiredToken]);
      mockBcryptCompare.mockResolvedValue(true);

      await expect(
        service.refresh(mockUser.id!, 'expired-refresh-token'),
      ).rejects.toThrow('Refresh token invalid or expired');
    });
  });

  describe('logout', () => {
    it('debe eliminar tokens y retornar mensaje de éxito', async () => {
      refreshTokenRepository.delete.mockResolvedValue({});

      const result = await service.logout(mockUser.id!);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
    });
  });

  describe('validateToken', () => {
    it('debe retornar userId, email e isActive cuando el usuario existe', async () => {
      userRepository.findOne.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        isActive: true,
      });

      const result = await service.validateToken(mockUser.id!);

      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        isActive: true,
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: ['id', 'email', 'isActive'],
      });
    });

    it('debe lanzar UnauthorizedException cuando el usuario no existe', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateToken('nonexistent-user-id'),
      ).rejects.toThrow('User not found');
    });
  });
});
