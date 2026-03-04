import { RefreshToken } from '../../../domain/auth/refresh-token.entity';
import type { RefreshToken as PrismaRefreshToken } from '@prisma/client';

export function toDomain(db: PrismaRefreshToken): RefreshToken {
  return RefreshToken.create({
    id: db.id,
    userId: db.userId,
    tokenHash: db.tokenHash,
    expiresAt: db.expiresAt,
  });
}
