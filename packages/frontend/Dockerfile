FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm ci

COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -w @escala/shared && npm run build -w @escala/frontend

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/packages/frontend/dist ./dist

CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
