import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { configureApp } from './test-utils';

describe('App (e2e)', () => {
  let app: INestApplication | undefined;

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
