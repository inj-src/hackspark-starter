# syntax=docker/dockerfile:1.7

FROM node:20-alpine3.20 AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine3.20 AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --omit=optional && npm cache clean --force

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8001

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

EXPOSE 8001

CMD ["dist/index.js"]
