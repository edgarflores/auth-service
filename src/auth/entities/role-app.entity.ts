import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RoleEntity } from './roles.entity';
import { AppEntity } from './app.entity';

@Entity('role_apps')
export class RoleAppEntity {
  @PrimaryColumn('uuid')
  roleId: string;

  @PrimaryColumn('uuid')
  appId: string;

  @ManyToOne(() => RoleEntity, (role) => role.roleApps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: RoleEntity;

  @ManyToOne(() => AppEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: AppEntity;
}
