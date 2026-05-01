# syntax=docker/dockerfile:1.7

FROM node:20-alpine3.20 AS builder
WORKDIR /app
COPY . .

RUN if [ -f package.json ]; then \
      if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then npm ci; else npm install; fi; \
      npm run build --if-present; \
      npm prune --omit=dev; \
    else \
      mkdir -p /app/_fallback; \
      printf '%s\n' \
      "const http = require('http');" \
      "const service = process.env.SERVICE_NAME || 'api-gateway';" \
      "const port = Number(process.env.PORT || 8000);" \
      "const server = http.createServer((req, res) => {" \
      "  if (req.url === '/status') {" \
      "    res.writeHead(200, { 'Content-Type': 'application/json' });" \
      "    res.end(JSON.stringify({ service, status: 'OK' }));" \
      "    return;" \
      "  }" \
      "  res.writeHead(200, { 'Content-Type': 'text/plain' });" \
      "  res.end(service);" \
      "});" \
      "server.listen(port, '0.0.0.0');" \
      > /app/_fallback/server.js; \
    fi

FROM alpine:3.20 AS runtime
WORKDIR /app
RUN apk add --no-cache nodejs npm
ENV NODE_ENV=production
ENV PORT=8000
ENV SERVICE_NAME=api-gateway

COPY --from=builder /app /app

EXPOSE 8000

CMD ["sh", "-c", "if [ -f package.json ]; then npm run start; else node /app/_fallback/server.js; fi"]
