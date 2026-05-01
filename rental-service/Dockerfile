# syntax=docker/dockerfile:1.7

FROM node:20-alpine3.20 AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine3.20 AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8002
ENV SERVICE_NAME=rental-service

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 8002

CMD ["node", "dist/server.js"]
