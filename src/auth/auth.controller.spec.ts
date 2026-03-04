import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginHandler } from '../application/auth/login/login.handler';
import { RegisterHandler } from '../application/auth/register/register.handler';
import { RefreshHandler } from '../application/auth/refresh/refresh.handler';
import { LogoutHandler } from '../application/auth/logout/logout.handler';
import { ValidateTokenHandler } from '../application/auth/validate-token/validate-token.handler';

describe('AuthController', () => {
  let controller: AuthController;
  const mockLoginHandler = { execute: jest.fn() };
  const mockRegisterHandler = { execute: jest.fn() };
  const mockRefreshHandler = { execute: jest.fn() };
  const mockLogoutHandler = { execute: jest.fn() };
  const mockValidateTokenHandler = { execute: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginHandler, useValue: mockLoginHandler },
        { provide: RegisterHandler, useValue: mockRegisterHandler },
        { provide: RefreshHandler, useValue: mockRefreshHandler },
        { provide: LogoutHandler, useValue: mockLogoutHandler },
        { provide: ValidateTokenHandler, useValue: mockValidateTokenHandler },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debe llamar a loginHandler.execute y retornar tokens', async () => {
      const dto: AuthCredentialsDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      const tokens = { accessToken: 'token', refreshToken: 'refresh' };
      mockLoginHandler.execute.mockResolvedValue(tokens);

      const result = await controller.login(dto);

      expect(mockLoginHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          password: 'password123',
        }),
      );
      expect(result).toEqual(tokens);
    });
  });

  describe('register', () => {
    it('debe llamar a registerHandler.execute', async () => {
      const dto: AuthCredentialsDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };
      mockRegisterHandler.execute.mockResolvedValue(undefined);

      await controller.register(dto);

      expect(mockRegisterHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@example.com',
          password: 'password123',
        }),
      );
    });
  });

  describe('refresh', () => {
    it('debe llamar a refreshHandler.execute con userId y refreshToken', async () => {
      const dto: RefreshTokenDto = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        refreshToken: 'refresh-token-uuid',
      };
      const tokens = { accessToken: 'newToken', refreshToken: 'newRefresh' };
      mockRefreshHandler.execute.mockResolvedValue(tokens);

      const result = await controller.refresh(dto);

      expect(mockRefreshHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: dto.userId,
          refreshToken: dto.refreshToken,
        }),
      );
      expect(result).toEqual(tokens);
    });
  });

  describe('logout', () => {
    it('debe llamar a logoutHandler.execute con userId del JWT (req.user)', async () => {
      const req = {
        user: { userId: '550e8400-e29b-41d4-a716-446655440000' },
      };
      mockLogoutHandler.execute.mockResolvedValue({
        message: 'Logged out successfully',
      });

      const result = await controller.logout(req);

      expect(mockLogoutHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: req.user.userId }),
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('validate', () => {
    it('debe llamar a validateTokenHandler.execute con req.user completo', async () => {
      const req = {
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          isActive: true,
          roles: ['user'],
          apps: ['ledgerflow'],
        },
      };
      const validateResult = {
        userId: req.user.userId,
        email: req.user.email,
        isActive: req.user.isActive,
        roles: req.user.roles,
        apps: req.user.apps,
      };
      mockValidateTokenHandler.execute.mockResolvedValue(validateResult);

      const result = await controller.validate(req);

      expect(mockValidateTokenHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: req.user.userId,
          email: req.user.email,
          isActive: req.user.isActive,
          roles: req.user.roles,
          apps: req.user.apps,
        }),
      );
      expect(result).toEqual(validateResult);
    });
  });
});
