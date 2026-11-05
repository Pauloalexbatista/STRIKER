# STRIKER - Dockerfile optimizado para Coolify / VPS
FROM node:24-alpine AS builder

WORKDIR /app

# 1. Copiar package files e instalar dependencias
COPY client/package*.json ./client/
RUN npm --prefix client install

# 2. Copiar codigo do cliente e fazer build de producao
COPY client/ ./client/
RUN npm --prefix client run build

# Stage de Producao
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copiar dependencias do backend
COPY server/package*.json ./server/
RUN npm --prefix server install --omit=dev

# Copiar codigo do backend e build estatico do frontend
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

# Criar directoria e guardar template de codigo de server/db para sobreviver a volumes Docker
RUN mkdir -p /app/server/db && \
    mkdir -p /app/server_db_template && \
    cp -rf /app/server/db/* /app/server_db_template/

EXPOSE 3001

# Na inicializacao, sincronizar ficheiros de codigo (.js e .json) para server/db preservando striker.db intacto
CMD ["sh", "-c", "mkdir -p /app/server/db && cp -f /app/server_db_template/*.js /app/server/db/ 2>/dev/null; cp -f /app/server_db_template/*.json /app/server/db/ 2>/dev/null; node --experimental-sqlite server/server.js"]
