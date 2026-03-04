import { RefreshToken } from '../refresh-token.entity';

/**
 * Port (driven): contrato para persistencia de RefreshToken.
 * Implementado por adapters en infrastructure.
 */
export const REFRESH_TOKEN_REPOSITORY = Symbol('IRefreshTokenRepository');

export interface IRefreshTokenRepository {
  save(token: { userId: string; tokenHash: string; expiresAt: Date }): Promise<RefreshToken>;

  findByUserId(userId: string): Promise<RefreshToken[]>;

  deleteById(id: string): Promise<void>;

  deleteByUserId(userId: string): Promise<void>;
}
