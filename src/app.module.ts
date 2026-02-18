import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { User } from './auth/entities/user.entity';
import { RefreshTokenEntity } from './auth/entities/refresh-tokens.entity';
import { RoleEntity } from './auth/entities/roles.entity';
import { EmailVerificationTokenEntity } from './auth/entities/email-verification-tokens.entity';
import { PasswordResetTokenEntity } from './auth/entities/password-reset-tokens.entity';
import { UserRoleEntity } from './auth/entities/user-roles.entity';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.body.password', 'req.body.refreshToken'],
      },
    }),
    PrometheusModule.register(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'auth_db',
      entities: [
        User,
        RefreshTokenEntity,
        RoleEntity,
        EmailVerificationTokenEntity,
        PasswordResetTokenEntity,
        UserRoleEntity
      ],
      synchronize: false,
    }),
    AuthModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
