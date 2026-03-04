import { RefreshToken } from '../../../domain/auth/refresh-token.entity';
import { RefreshTokenOrmEntity } from '../typeorm/entities/refresh-token-orm.entity';

export function toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
  return RefreshToken.create({
    id: orm.id,
    userId: orm.userId,
    tokenHash: orm.tokenHash,
    expiresAt: orm.expiresAt,
  });
}
