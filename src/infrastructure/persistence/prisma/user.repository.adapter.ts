import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/auth/user.entity';
import { IUserRepository } from '../../../domain/auth/ports/user.repository.port';
import { PrismaService } from './prisma.service';
import { toDomain, userWithRolesInclude } from '../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const db = await this.prisma.user.findUnique({
      where: { id },
      include: userWithRolesInclude,
    });
    return db ? toDomain(db) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = await this.prisma.user.findUnique({
      where: { email },
      include: userWithRolesInclude,
    });
    return db ? toDomain(db) : null;
  }

  async save(data: { email: string; passwordHash: string }): Promise<User> {
    const saved = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
      },
      include: userWithRolesInclude,
    });
    return toDomain(saved);
  }
}
