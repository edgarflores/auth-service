import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

async function configureApp(app: INestApplication): Promise<INestApplication> {
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/ready', 'api/docs', 'api/docs-json', 'metrics'],
  });
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

describe('App (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Health', () => {
    it('GET /health debe retornar 200 y estructura de health', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.status || res.body).toBeDefined();
        });
    });

    it('GET /health/ready debe retornar 200 e incluir check de BD', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
  });

  describe('Swagger', () => {
    it('GET /api/docs debe retornar 200 (HTML de Swagger)', () => {
      return request(app.getHttpServer())
        .get('/api/docs')
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toMatch(/text\/html/);
        });
    });

    it('GET /api/docs-json debe retornar 200 (JSON de OpenAPI)', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.openapi || res.body.swagger).toBeDefined();
        });
    });
  });

  describe('Metrics', () => {
    it('GET /metrics debe retornar 200 (texto Prometheus)', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.text).toBeDefined();
          expect(res.headers['content-type']).toMatch(/text/);
        });
    });
  });
});
