import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RoleOrmEntity } from './roles-orm.entity';
import { AppOrmEntity } from './app-orm.entity';

@Entity('role_apps')
export class RoleAppOrmEntity {
  @PrimaryColumn('uuid')
  roleId: string;

  @PrimaryColumn('uuid')
  appId: string;

  @ManyToOne(() => RoleOrmEntity, (role) => role.roleApps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: RoleOrmEntity;

  @ManyToOne(() => AppOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: AppOrmEntity;
}
