# Stage 1: builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8004

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:8004/status || exit 1

CMD ["node", "dist/index.js"]
