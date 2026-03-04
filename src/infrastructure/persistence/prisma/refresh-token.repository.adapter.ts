import { Injectable } from '@nestjs/common';
import { RefreshToken } from '../../../domain/auth/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../domain/auth/ports/refresh-token.repository.port';
import { PrismaService } from './prisma.service';
import { toDomain } from '../mappers/refresh-token.mapper';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<RefreshToken> {
    const saved = await this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
    return toDomain(saved);
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const list = await this.prisma.refreshToken.findMany({
      where: { userId },
    });
    return list.map(toDomain);
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({ where: { id } });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
