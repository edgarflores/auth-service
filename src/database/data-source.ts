import { resolve } from 'path';
import { DataSource } from 'typeorm';

const projectRoot = resolve(__dirname, '..', '..');

// Cargar .env solo si dotenv está disponible (no en producción Docker)
try {
  require('dotenv').config({ path: resolve(projectRoot, '.env') });
} catch {
  // dotenv no instalado (ej. yarn install --production); usar process.env de Docker
}

// Rutas que funcionan tanto con src/ (ts-node) como con dist/ (compilado)
const isCompiled = __dirname.includes('dist');
const entities = isCompiled
  ? [resolve(projectRoot, 'dist', '**', '*.entity.js')]
  : [resolve(projectRoot, 'src', '**', '*.entity.{ts,js}')];
const migrations = isCompiled
  ? [resolve(projectRoot, 'dist', 'database', 'migrations', '**', '*.js')]
  : [resolve(projectRoot, 'src', 'database', 'migrations', '**', '*.{ts,js}')];

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'auth_db',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  entities,
  migrations,
  migrationsTableName: 'migrations',
});
