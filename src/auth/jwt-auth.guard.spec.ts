import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('debe instanciarse como wrapper de AuthGuard(jwt)', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
    expect(typeof guard.canActivate).toBe('function');
  });
});
