/**
 * Port (driven): contrato para generación y validación de tokens.
 * Implementado por JwtTokenService en infrastructure.
 */
export const TOKEN_SERVICE = Symbol('ITokenService');

export interface TokenPayload {
  sub: string;
  email: string;
  isActive: boolean;
  roles: string[];
  apps: string[];
}

export interface ITokenService {
  signAccessToken(payload: TokenPayload): Promise<string>;

  generateRefreshTokenValue(): string;
}
