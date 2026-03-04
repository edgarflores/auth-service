import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt-strategy';
import { RefreshTokenEntity } from './entities/refresh-tokens.entity';
import { UserRoleEntity } from './entities/user-roles.entity';
import { RoleEntity } from './entities/roles.entity';
import { AppEntity } from './entities/app.entity';
import { RoleAppEntity } from './entities/role-app.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      RefreshTokenEntity,
      UserRoleEntity,
      RoleEntity,
      AppEntity,
      RoleAppEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'secretKey',
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}
