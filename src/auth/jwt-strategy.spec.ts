import { JwtStrategy } from './jwt-strategy';
import { IJwtPayload } from './jwt-payload.interface';

describe('JwtStrategy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('debe lanzar error cuando JWT_SECRET no está definido', () => {
      const saved = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      try {
        expect(() => new JwtStrategy()).toThrow(
        'JWT_SECRET is required. Set it in your environment variables.',
        );
      } finally {
        if (saved !== undefined) process.env.JWT_SECRET = saved;
      }
    });

    it('debe instanciar correctamente cuando JWT_SECRET está definido', () => {
      expect(() => new JwtStrategy()).not.toThrow();
    });
  });

  describe('validate', () => {
    it('debe mapear payload a userId, email, isActive, roles y apps', async () => {
      const strategy = new JwtStrategy();
      const payload: IJwtPayload = {
        sub: 'user-id-123',
        email: 'user@example.com',
        isActive: true,
        roles: ['admin', 'user'],
        apps: ['ledgerflow'],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-id-123',
        email: 'user@example.com',
        isActive: true,
        roles: ['admin', 'user'],
        apps: ['ledgerflow'],
      });
    });

    it('debe usar arrays vacíos cuando roles o apps son undefined', async () => {
      const strategy = new JwtStrategy();
      const payload = {
        sub: 'user-id',
        email: 'user@example.com',
        isActive: true,
        roles: undefined,
        apps: undefined,
      } as IJwtPayload;

      const result = await strategy.validate(payload);

      expect(result.roles).toEqual([]);
      expect(result.apps).toEqual([]);
    });
  });
});
