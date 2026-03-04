import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ValidateResponseDto } from './dto/validate-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Tokens generados correctamente' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/login')
  async login(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(authCredentialsDto);
  }

  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('/register')
  register(@Body() authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.authService.register(authCredentialsDto);
  }

  @ApiOperation({ summary: 'Renovar tokens (sin JWT requerido)' })
  @ApiResponse({ status: 200, description: 'Nuevos tokens generados' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.userId, dto.refreshToken);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.userId);
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
  @Get('validate')
  validate(@Req() req: { user: { userId: string; email: string; isActive: boolean; roles: string[]; apps: string[] } }) {
    return this.authService.validateToken(req.user);
  }
}
