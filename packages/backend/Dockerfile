FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm ci --include=dev

COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY packages/frontend ./packages/frontend

RUN npm run build -w @escala/shared \
  && npm run build -w @escala/backend \
  && npm run build -w @escala/frontend

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV FRONTEND_DIST=/app/packages/frontend/dist

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/src/db/migrations ./packages/backend/dist/db/migrations
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist

WORKDIR /app/packages/backend

EXPOSE 3001

CMD ["sh", "-c", "node dist/db/migrate.js && node dist/server.js"]
