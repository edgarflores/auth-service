/**
 * Configuración centralizada de conexión PostgreSQL.
 * Fuente única de verdad para app.module, data-source (migraciones) y seed.
 */
export function getDbConnectionOptions() {
  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'auth_db',
    synchronize: false,
  };
}
