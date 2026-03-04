#!/bin/sh
set -e

# Ejecutar migraciones antes de iniciar la app (usa variables de docker-compose: DB_HOST=postgres, etc.)
echo "Ejecutando migraciones..."
node ./node_modules/typeorm/cli.js migration:run -d ./dist/database/data-source.js || {
  echo "ADVERTENCIA: Las migraciones fallaron. Verifica la conexión a PostgreSQL."
  exit 1
}

echo "Migraciones completadas. Iniciando aplicación..."
exec node dist/main.js
