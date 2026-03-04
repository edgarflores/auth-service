import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ValidateResponseDto } from './dto/validate-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginHandler } from '../application/auth/login/login.handler';
import { LoginCommand } from '../application/auth/login/login.command';
import { RegisterHandler } from '../application/auth/register/register.handler';
import { RegisterCommand } from '../application/auth/register/register.command';
import { RefreshHandler } from '../application/auth/refresh/refresh.handler';
import { RefreshCommand } from '../application/auth/refresh/refresh.command';
import { LogoutHandler } from '../application/auth/logout/logout.handler';
import { LogoutCommand } from '../application/auth/logout/logout.command';
import { ValidateTokenHandler } from '../application/auth/validate-token/validate-token.handler';
import { ValidateTokenCommand } from '../application/auth/validate-token/validate-token.command';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginHandler: LoginHandler,
    private readonly registerHandler: RegisterHandler,
    private readonly refreshHandler: RefreshHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly validateTokenHandler: ValidateTokenHandler,
  ) {}

  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Tokens generados correctamente' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/login')
  async login(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const command = new LoginCommand(authCredentialsDto.email, authCredentialsDto.password);
    return this.loginHandler.execute(command);
  }

  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('/register')
  register(@Body() authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const command = new RegisterCommand(authCredentialsDto.email, authCredentialsDto.password);
    return this.registerHandler.execute(command);
  }

  @ApiOperation({ summary: 'Renovar tokens (sin JWT requerido)' })
  @ApiResponse({ status: 200, description: 'Nuevos tokens generados' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  @Post('/refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    const command = new RefreshCommand(dto.userId, dto.refreshToken);
    return this.refreshHandler.execute(command);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada' })
  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  logout(@Req() req: { user: { userId: string } }) {
    const command = new LogoutCommand(req.user.userId);
    return this.logoutHandler.execute(command);
  }

  @ApiBearerAuth('bearer')
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token obtenido en POST /auth/login',
    required: true,
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE3MDgxMDAwMDB9.xxxxx',
  })
  @ApiOperation({
    summary: 'Validar token (para otros microservicios)',
    description: `
**Request (Header requerido):**
- \`Authorization\`: Bearer + access token JWT

**Flujo:** El JWT se valida y se extrae del payload: userId, email, isActive, roles y apps. No se consulta BD.

**req.user** (después de validar): \`{ userId, email, isActive, roles, apps }\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Token válido, datos del usuario',
    type: ValidateResponseDto,
    schema: {
      example: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        isActive: true,
        roles: ['user'],
        apps: ['ledgerflow'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid token',
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('/validate')
  validate(@Req() req: { user: { userId: string; email: string; isActive: boolean; roles: string[]; apps: string[] } }) {
    const command = new ValidateTokenCommand(
      req.user.userId,
      req.user.email,
      req.user.isActive,
      req.user.roles,
      req.user.apps,
    );
    return this.validateTokenHandler.execute(command);
  }
}
