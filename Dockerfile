# ========== Etapa de build ==========
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ========== Etapa final (imagen ligera) ==========
FROM node:20-alpine

RUN apk add --no-cache wget

WORKDIR /app

# Solo dependencias de producción
COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copiar schema Prisma y generar cliente (requerido para @prisma/client)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
RUN npx prisma generate

# Copiar build desde etapa anterior
COPY --from=builder /app/dist ./dist

# Copiar entrypoint que ejecuta migraciones antes de iniciar la app
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

ENTRYPOINT ["./docker-entrypoint.sh"]
