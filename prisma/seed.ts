import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ?? '5432';
  const user = process.env.DB_USERNAME ?? process.env.DB_USER ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? 'postgres';
  const database = process.env.DB_NAME ?? 'auth_db';
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

const ROLES = [
  { name: 'admin', description: 'Administrador del sistema con acceso total' },
  { name: 'user', description: 'Usuario estándar con acceso básico' },
  { name: 'moderator', description: 'Moderador con permisos de gestión de contenido' },
];

const APPS = [
  { code: 'ledgerflow', name: 'LedgerFlow', description: 'Sistema de contabilidad y finanzas' },
  { code: 'admin-panel', name: 'Admin Panel', description: 'Panel de administración del sistema' },
];

const ROLE_APP_MAPPINGS: { roleName: string; appCodes: string[] }[] = [
  { roleName: 'admin', appCodes: ['ledgerflow', 'admin-panel'] },
  { roleName: 'user', appCodes: ['ledgerflow'] },
  { roleName: 'moderator', appCodes: ['ledgerflow', 'admin-panel'] },
];

async function seedRoles(): Promise<void> {
  for (const role of ROLES) {
    const existing = await prisma.role.findUnique({ where: { name: role.name } });
    if (existing) {
      console.log(`  - Rol "${role.name}" ya existe, omitiendo`);
      continue;
    }
    await prisma.role.create({ data: role });
    console.log(`  ✓ Rol "${role.name}" creado`);
  }
}

async function seedApps(): Promise<void> {
  for (const app of APPS) {
    const existing = await prisma.app.findUnique({ where: { code: app.code } });
    if (existing) {
      console.log(`  - App "${app.code}" ya existe, omitiendo`);
      continue;
    }
    await prisma.app.create({ data: app });
    console.log(`  ✓ App "${app.code}" creado`);
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
  const moderatorRole = await prisma.role.findUnique({ where: { name: 'moderator' } });
  const apps = await prisma.app.findMany();

  for (const mapping of ROLE_APP_MAPPINGS) {
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

      const existing = await prisma.roleApp.findUnique({
        where: { roleId_appId: { roleId: role.id, appId: app.id } },
      });
      if (existing) continue;

      await prisma.roleApp.create({
        data: { roleId: role.id, appId: app.id },
      });
      console.log(`  ✓ Rol "${mapping.roleName}" -> App "${code}" asociado`);
    }
  }
}

async function main(): Promise<void> {
  try {
    console.log('Conectado a la base de datos. Ejecutando seeders...\n');
    await seedRoles();
    await seedApps();
    console.log('\n✓ Seed completado correctamente');
  } catch (error) {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
