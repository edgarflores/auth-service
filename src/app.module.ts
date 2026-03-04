import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { getDbConnectionOptions } from './database/typeorm.config';
import {
  UserOrmEntity,
  RefreshTokenOrmEntity,
  RoleOrmEntity,
  UserRoleOrmEntity,
  AppOrmEntity,
  RoleAppOrmEntity,
} from './infrastructure/persistence/typeorm/entities';

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
      ...getDbConnectionOptions(),
      entities: [
        UserOrmEntity,
        RefreshTokenOrmEntity,
        RoleOrmEntity,
        UserRoleOrmEntity,
        AppOrmEntity,
        RoleAppOrmEntity,
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
