import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../../../domain/auth/refresh-token.entity';
import {
  IRefreshTokenRepository,
} from '../../../domain/auth/ports/refresh-token.repository.port';
import { RefreshTokenOrmEntity } from './entities/refresh-token-orm.entity';
import { toDomain } from '../mappers/refresh-token.mapper';

@Injectable()
export class TypeOrmRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  async save(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<RefreshToken> {
    const orm = this.repo.create({
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    });
    const saved = await this.repo.save(orm);
    return toDomain(saved);
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const list = await this.repo.find({ where: { userId } });
    return list.map(toDomain);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }
}
