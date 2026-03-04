import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user-orm.entity';
import { RoleOrmEntity } from './roles-orm.entity';

@Entity('user_roles')
export class UserRoleOrmEntity {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  roleId: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;

  @ManyToOne(() => RoleOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: RoleOrmEntity;
}
