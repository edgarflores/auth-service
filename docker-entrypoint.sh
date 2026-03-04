#!/bin/sh
set -e

# Ejecutar migraciones antes de iniciar la app (usa variables de docker-compose: DATABASE_URL, DB_*, etc.)
echo "Ejecutando migraciones Prisma..."
npx prisma migrate deploy || {
  echo "ADVERTENCIA: Las migraciones fallaron. Verifica la conexión a PostgreSQL."
  exit 1
}

echo "Migraciones completadas. Iniciando aplicación..."
exec node dist/main.js
