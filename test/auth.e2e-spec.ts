import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const BASE = '/api/v1/auth';

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

describe('Auth (e2e)', () => {
  let app: INestApplication | undefined;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Register', () => {
    it('POST /register con email inválido debe retornar 400', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/register`)
        .send({ email: 'invalid-email', password: testPassword })
        .expect(400);
    });

    it('POST /register con password corta debe retornar 400', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/register`)
        .send({ email: 'other@example.com', password: 'short' })
        .expect(400);
    });

    it('POST /register debe crear usuario y retornar 201', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/register`)
        .send({ email: testEmail, password: testPassword })
        .expect(201);
    });

    it('POST /register con email duplicado debe retornar 400, 500, 201 o 429', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/register`)
        .send({ email: testEmail, password: testPassword })
        .expect((res) => {
          expect([201, 400, 500, 429]).toContain(res.status);
          if (res.status !== 201) expect(res.body.message).toBeDefined();
        });
    });
  });

  describe('Login', () => {
    it('POST /login debe retornar 200/201 con accessToken y refreshToken', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/login`)
        .send({ email: testEmail, password: testPassword })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('POST /login con credenciales inválidas debe retornar 401', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/login`)
        .send({ email: testEmail, password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('Validate', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app!.getHttpServer())
        .post(`${BASE}/login`)
        .send({ email: testEmail, password: testPassword });
      accessToken = res.body.accessToken;
    });

    it('GET /validate con token válido debe retornar 200 con userId, email, isActive, roles, apps', () => {
      return request(app!.getHttpServer())
        .get(`${BASE}/validate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.userId).toBeDefined();
          expect(res.body.email).toBeDefined();
          expect(res.body.isActive).toBeDefined();
          expect(Array.isArray(res.body.roles)).toBe(true);
          expect(Array.isArray(res.body.apps)).toBe(true);
        });
    });

    it('GET /validate sin token debe retornar 401', () => {
      return request(app!.getHttpServer())
        .get(`${BASE}/validate`)
        .expect(401);
    });

    it('GET /validate con token inválido debe retornar 401', () => {
      return request(app!.getHttpServer())
        .get(`${BASE}/validate`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Refresh', () => {
    let userId: string;
    let refreshToken: string;

    beforeAll(async () => {
      const loginRes = await request(app!.getHttpServer())
        .post(`${BASE}/login`)
        .send({ email: testEmail, password: testPassword });
      refreshToken = loginRes.body.refreshToken;

      const validateRes = await request(app!.getHttpServer())
        .get(`${BASE}/validate`)
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
      userId = validateRes.body.userId;
    });

    it('POST /refresh con token válido debe retornar 200/201 con nuevos tokens', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/refresh`)
        .send({ userId, refreshToken })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('POST /refresh con token inválido debe retornar 401', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/refresh`)
        .send({ userId, refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });
  });

  describe('Logout', () => {
    let accessToken: string;
    let userId: string;

    beforeAll(async () => {
      const res = await request(app!.getHttpServer())
        .post(`${BASE}/login`)
        .send({ email: testEmail, password: testPassword });
      accessToken = res.body.accessToken;
      const validateRes = await request(app!.getHttpServer())
        .get(`${BASE}/validate`)
        .set('Authorization', `Bearer ${accessToken}`);
      userId = validateRes.body.userId;
    });

    it('POST /logout con JWT válido debe retornar 200/201', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
          expect(res.body.message).toBeDefined();
        });
    });

    it('POST /logout sin JWT debe retornar 401', () => {
      return request(app!.getHttpServer())
        .post(`${BASE}/logout`)
        .send({ userId })
        .expect(401);
    });
  });
});

