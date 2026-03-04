import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debe llamar a authService.login y retornar tokens', async () => {
      const dto: AuthCredentialsDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      const tokens = { accessToken: 'token', refreshToken: 'refresh' };
      mockAuthService.login.mockResolvedValue(tokens);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });
  });

  describe('register', () => {
    it('debe llamar a authService.register', async () => {
      const dto: AuthCredentialsDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };
      mockAuthService.register.mockResolvedValue(undefined);

      await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('debe llamar a authService.refresh con userId y refreshToken', async () => {
      const dto: RefreshTokenDto = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        refreshToken: 'refresh-token-uuid',
      };
      const tokens = { accessToken: 'newToken', refreshToken: 'newRefresh' };
      mockAuthService.refresh.mockResolvedValue(tokens);

      const result = await controller.refresh(dto);

      expect(authService.refresh).toHaveBeenCalledWith(
        dto.userId,
        dto.refreshToken,
      );
      expect(result).toEqual(tokens);
    });
  });

  describe('logout', () => {
    it('debe llamar a authService.logout con userId', async () => {
      const dto: LogoutDto = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };
      mockAuthService.logout.mockResolvedValue({
        message: 'Logged out successfully',
      });

      const result = await controller.logout(dto);

      expect(authService.logout).toHaveBeenCalledWith(dto.userId);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('validate', () => {
    it('debe llamar a authService.validateToken con req.user completo', async () => {
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
      mockAuthService.validateToken.mockReturnValue(validateResult);

      const result = await controller.validate(req);

      expect(authService.validateToken).toHaveBeenCalledWith(req.user);
      expect(result).toEqual(validateResult);
    });
  });
});
