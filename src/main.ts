import { resolve } from 'path';
try {
  require('dotenv').config({ path: resolve(process.cwd(), '.env') });
} catch {
  // dotenv no disponible en producción
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.config';

function validateProductionEnv() {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
  }
}

async function bootstrap() {
  validateProductionEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  await configureApp(app);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? '*',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3006);
}
bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
