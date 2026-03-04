import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { TokenPayload } from '../domain/auth/ports/token.service.port';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_SECRET is required. Set it in your environment variables.',
      );
    }
    super({
      secretOrKey: secret,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: TokenPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      isActive: payload.isActive,
      roles: payload.roles ?? [],
      apps: payload.apps ?? [],
    };
  }
}
