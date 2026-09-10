# STRIKER - Dockerfile optimizado para Coolify / VPS
FROM node:24-alpine AS builder

WORKDIR /app

# 1. Copiar package files e instalar dependências
COPY client/package*.json ./client/
RUN npm --prefix client install

# 2. Copiar código do cliente e fazer build de produção
COPY client/ ./client/
RUN npm --prefix client run build

# Stage de Produção
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copiar dependências do backend
COPY server/package*.json ./server/
RUN npm --prefix server install --omit=dev

# Copiar código do backend e build estático do frontend
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

# Criar directório persistente para a base de dados SQLite
RUN mkdir -p /app/server/db

EXPOSE 3001

VOLUME ["/app/server/db"]

CMD ["node", "--experimental-sqlite", "server/server.js"]
