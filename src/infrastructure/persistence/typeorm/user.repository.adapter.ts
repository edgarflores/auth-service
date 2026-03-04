import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/auth/user.entity';
import { IUserRepository } from '../../../domain/auth/ports/user.repository.port';
import { UserOrmEntity } from './entities/user-orm.entity';
import { toDomain } from '../mappers/user.mapper';

const USER_WITH_ROLES_RELATIONS = [
  'userRoles',
  'userRoles.role',
  'userRoles.role.roleApps',
  'userRoles.role.roleApps.app',
] as const;

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({
      where: { id },
      relations: [...USER_WITH_ROLES_RELATIONS],
    });
    return orm ? toDomain(orm) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const orm = await this.repo.findOne({
      where: { email },
      relations: [...USER_WITH_ROLES_RELATIONS],
    });
    return orm ? toDomain(orm) : null;
  }

  async save(data: { email: string; passwordHash: string }): Promise<User> {
    const orm = this.repo.create({
      email: data.email,
      password: data.passwordHash,
    });
    const saved = await this.repo.save(orm);
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: [...USER_WITH_ROLES_RELATIONS],
    });
    return toDomain(withRelations ?? saved);
  }
}
