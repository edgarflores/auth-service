import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const PREFIX_EXCLUDE = [
  'health',
  'health/ready',
  'api/docs',
  'api/docs-json',
  'metrics',
];

/**
 * Configura la aplicación Nest: prefix, ValidationPipe, HttpExceptionFilter, Swagger.
 * Reutilizado por main.ts y tests e2e.
 */
export async function configureApp(
  app: INestApplication,
): Promise<INestApplication> {
  app.setGlobalPrefix('api/v1', { exclude: PREFIX_EXCLUDE });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription(
      'Microservicio de autenticación - Login, registro, refresh y validación de tokens',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token obtenido en POST /auth/login',
        name: 'Authorization',
        in: 'header',
      },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  return app;
}
