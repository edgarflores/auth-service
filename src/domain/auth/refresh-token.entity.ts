/**
 * Entidad de dominio RefreshToken.
 * Pertenece al agregado de sesión; referenciable por userId.
 */
export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export class RefreshToken {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
  ) {}

  static create(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props.id, props.userId, props.tokenHash, props.expiresAt);
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this.expiresAt;
  }
}
