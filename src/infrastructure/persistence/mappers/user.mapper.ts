import { User } from '../../../domain/auth/user.entity';
import { PasswordHash } from '../../../domain/auth/value-objects/password-hash.vo';
import { UserOrmEntity } from '../typeorm/entities/user-orm.entity';

export function toDomain(orm: UserOrmEntity): User {
  const roles: string[] = [];
  const apps: string[] = [];

  for (const ur of orm.userRoles ?? []) {
    if (ur.role) {
      roles.push(ur.role.name);
      for (const ra of ur.role.roleApps ?? []) {
        if (ra.app) apps.push(ra.app.code);
      }
    }
  }

  return User.create({
    id: orm.id,
    email: orm.email,
    passwordHash: PasswordHash.create(orm.password),
    isActive: orm.isActive,
    roles,
    apps,
  });
}
