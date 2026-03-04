import 'dotenv/config';
import { DataSource } from 'typeorm';
import { seedRoles } from './seeders/roles.seeder';
import { seedApps } from './seeders/apps.seeder';
import { getDbConnectionOptions } from './typeorm.config';

const dataSource = new DataSource({
  ...getDbConnectionOptions(),
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
