import { DataSource } from 'typeorm';
import { RoleOrmEntity } from '../../infrastructure/persistence/typeorm/entities/roles-orm.entity';

const ROLES = [
  { name: 'admin', description: 'Administrador del sistema con acceso total' },
  { name: 'user', description: 'Usuario estándar con acceso básico' },
  { name: 'moderator', description: 'Moderador con permisos de gestión de contenido' },
];

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository(RoleOrmEntity);

  for (const role of ROLES) {
    const existing = await roleRepo.findOne({ where: { name: role.name } });
    if (existing) {
      console.log(`  - Rol "${role.name}" ya existe, omitiendo`);
      continue;
    }
    await roleRepo.save(roleRepo.create(role));
    console.log(`  ✓ Rol "${role.name}" creado`);
  }
}
