# syntax=docker/dockerfile:1.7

FROM node:20-alpine3.20 AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine3.20 AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8003
ENV SERVICE_NAME=analytics-service

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/dist /app/dist

EXPOSE 8003

CMD ["node", "dist/server.js"]
