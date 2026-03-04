import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt-strategy';
import { USER_REPOSITORY } from '../domain/auth/ports/user.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../domain/auth/ports/refresh-token.repository.port';
import { PASSWORD_HASHER } from '../domain/auth/ports/password-hasher.port';
import { TOKEN_SERVICE } from '../domain/auth/ports/token.service.port';
import { TypeOrmUserRepository } from '../infrastructure/persistence/typeorm/user.repository.adapter';
import { TypeOrmRefreshTokenRepository } from '../infrastructure/persistence/typeorm/refresh-token.repository.adapter';
import { BcryptPasswordHasher } from '../infrastructure/auth/bcrypt-password-hasher.adapter';
import { JwtTokenServiceAdapter } from '../infrastructure/auth/jwt-token.service.adapter';
import { LoginHandler } from '../application/auth/login/login.handler';
import { RegisterHandler } from '../application/auth/register/register.handler';
import { RefreshHandler } from '../application/auth/refresh/refresh.handler';
import { LogoutHandler } from '../application/auth/logout/logout.handler';
import { ValidateTokenHandler } from '../application/auth/validate-token/validate-token.handler';
import {
  UserOrmEntity,
  RefreshTokenOrmEntity,
  UserRoleOrmEntity,
  RoleOrmEntity,
  AppOrmEntity,
  RoleAppOrmEntity,
} from '../infrastructure/persistence/typeorm/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RefreshTokenOrmEntity,
      UserRoleOrmEntity,
      RoleOrmEntity,
      AppOrmEntity,
      RoleAppOrmEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error(
            'JWT_SECRET is required. Set it in your environment variables.',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: TypeOrmRefreshTokenRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenServiceAdapter },
    LoginHandler,
    RegisterHandler,
    RefreshHandler,
    LogoutHandler,
    ValidateTokenHandler,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}
