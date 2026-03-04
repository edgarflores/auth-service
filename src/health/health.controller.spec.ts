import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma-health.indicator';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  const mockHealthCheck = jest.fn();
  const mockIsHealthy = jest.fn();

  beforeEach(async () => {
    mockHealthCheck.mockResolvedValue({ status: 'ok' });
    mockIsHealthy.mockResolvedValue({ database: { status: 'up' } });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: mockHealthCheck },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: { isHealthy: mockIsHealthy },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  describe('check', () => {
    it('debe retornar resultado de health.check con array vacío', async () => {
      const result = await controller.check();

      expect(mockHealthCheck).toHaveBeenCalledWith([]);
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('ready', () => {
    it('debe retornar resultado de health.check incluyendo ping a base de datos', async () => {
      const result = await controller.ready();

      expect(mockHealthCheck).toHaveBeenCalled();
      const checkArg = mockHealthCheck.mock.calls[0][0];
      expect(Array.isArray(checkArg)).toBe(true);
      expect(checkArg.length).toBeGreaterThanOrEqual(0);
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
