/**
 * Construye DATABASE_URL desde variables DB_* para compatibilidad con Prisma y Docker.
 */
export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ?? '5432';
  const user = process.env.DB_USERNAME ?? process.env.DB_USER ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? 'postgres';
  const database = process.env.DB_NAME ?? 'auth_db';
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}
