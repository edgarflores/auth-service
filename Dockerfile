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

# Copiar build desde etapa anterior
COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/main.js"]
