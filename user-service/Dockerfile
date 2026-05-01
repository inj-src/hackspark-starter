# syntax=docker/dockerfile:1.7

FROM node:20-alpine3.20 AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM node:20-alpine3.20 AS runtime
WORKDIR /app
RUN corepack enable

ENV NODE_ENV=production
ENV PORT=8001

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

EXPOSE 8001

CMD ["pnpm", "start:migrated"]
