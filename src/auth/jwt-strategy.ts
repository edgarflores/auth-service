import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtPayload } from './jwt-payload.interface';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKey: process.env.JWT_SECRET ?? 'secretKey',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: IJwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      isActive: payload.isActive,
      roles: payload.roles ?? [],
      apps: payload.apps ?? [],
    };
  }
}
