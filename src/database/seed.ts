import 'dotenv/config';
import { DataSource } from 'typeorm';
import { seedRoles } from './seeders/roles.seeder';
import { seedApps } from './seeders/apps.seeder';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'auth_db',
  synchronize: false,
  entities: ['src/**/*.entity{.ts,.js}'],
});

async function runSeed(): Promise<void> {
  try {
    await dataSource.initialize();
    console.log('Conectado a la base de datos. Ejecutando seeders...\n');

    await seedRoles(dataSource);
    await seedApps(dataSource);

    console.log('\n✓ Seed completado correctamente');
  } catch (error) {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeed();
