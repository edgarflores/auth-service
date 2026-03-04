import { DataSource } from 'typeorm';
import { AppOrmEntity } from '../../infrastructure/persistence/typeorm/entities/app-orm.entity';
import { RoleOrmEntity } from '../../infrastructure/persistence/typeorm/entities/roles-orm.entity';
import { RoleAppOrmEntity } from '../../infrastructure/persistence/typeorm/entities/role-app-orm.entity';

const APPS = [
  { code: 'ledgerflow', name: 'LedgerFlow', description: 'Sistema de contabilidad y finanzas' },
  { code: 'admin-panel', name: 'Admin Panel', description: 'Panel de administración del sistema' },
];

export async function seedApps(dataSource: DataSource): Promise<void> {
  const appRepo = dataSource.getRepository(AppOrmEntity);
  const roleRepo = dataSource.getRepository(RoleOrmEntity);
  const roleAppRepo = dataSource.getRepository(RoleAppOrmEntity);

  for (const app of APPS) {
    const existing = await appRepo.findOne({ where: { code: app.code } });
    if (existing) {
      console.log(`  - App "${app.code}" ya existe, omitiendo`);
      continue;
    }
    await appRepo.save(appRepo.create(app));
    console.log(`  ✓ App "${app.code}" creado`);
  }

  const adminRole = await roleRepo.findOne({ where: { name: 'admin' } });
  const userRole = await roleRepo.findOne({ where: { name: 'user' } });
  const moderatorRole = await roleRepo.findOne({ where: { name: 'moderator' } });
  const apps = await appRepo.find();

  const roleAppMappings: { roleName: string; appCodes: string[] }[] = [
    { roleName: 'admin', appCodes: ['ledgerflow', 'admin-panel'] },
    { roleName: 'user', appCodes: ['ledgerflow'] },
    { roleName: 'moderator', appCodes: ['ledgerflow', 'admin-panel'] },
  ];

  for (const mapping of roleAppMappings) {
    const role =
      mapping.roleName === 'admin'
        ? adminRole
        : mapping.roleName === 'user'
          ? userRole
          : moderatorRole;

    if (!role) {
      console.log(`  - Rol "${mapping.roleName}" no encontrado, omitiendo apps`);
      continue;
    }

    for (const code of mapping.appCodes) {
      const app = apps.find((a) => a.code === code);
      if (!app) continue;

      const existing = await roleAppRepo.findOne({
        where: { roleId: role.id, appId: app.id },
      });
      if (existing) continue;

      await roleAppRepo.save(
        roleAppRepo.create({ roleId: role.id, appId: app.id }),
      );
      console.log(`  ✓ Rol "${mapping.roleName}" -> App "${code}" asociado`);
    }
  }
}
