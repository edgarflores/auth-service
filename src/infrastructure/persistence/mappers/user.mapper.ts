import { Prisma } from '@prisma/client';
import { User } from '../../../domain/auth/user.entity';
import { PasswordHash } from '../../../domain/auth/value-objects/password-hash.vo';

export const userWithRolesInclude = {
  userRoles: {
    include: {
      role: {
        include: {
          roleApps: { include: { app: true } },
        },
      },
    },
  },
} as const satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{
  include: typeof userWithRolesInclude;
}>;

export function toDomain(db: UserWithRoles): User {
  const roles: string[] = [];
  const apps: string[] = [];

  for (const ur of db.userRoles ?? []) {
    if (ur.role) {
      roles.push(ur.role.name);
      for (const ra of ur.role.roleApps ?? []) {
        if (ra.app) apps.push(ra.app.code);
      }
    }
  }

  return User.create({
    id: db.id,
    email: db.email,
    passwordHash: PasswordHash.create(db.password),
    isActive: db.isActive,
    roles,
    apps,
  });
}
