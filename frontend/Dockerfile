# syntax=docker/dockerfile:1.7

FROM node:20-alpine3.20 AS builder
WORKDIR /app
COPY . .

RUN if [ -f package.json ]; then \
      if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then npm ci; else npm install; fi; \
      npm run build; \
      if [ -d dist ]; then cp -R dist /app/out; \
      elif [ -d build ]; then cp -R build /app/out; \
      else echo "Frontend build did not produce dist/ or build/." >&2; exit 1; fi; \
    else \
      mkdir -p /app/out; \
      printf '%s\n' \
      "<!doctype html>" \
      "<html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><title>RentPi Frontend</title></head>" \
      "<body style='font-family:Arial,sans-serif;padding:24px'><h1>RentPi Frontend</h1><p>Frontend source not added yet.</p></body></html>" \
      > /app/out/index.html; \
    fi

FROM nginx:stable-alpine3.21-slim AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/out/ /usr/share/nginx/html/

RUN printf '%s\n' \
  "server {" \
  "  listen 3000;" \
  "  server_name _;" \
  "  root /usr/share/nginx/html;" \
  "  index index.html;" \
  "  location = /status {" \
  "    default_type application/json;" \
  "    return 200 '{\"service\":\"frontend\",\"status\":\"OK\"}';" \
  "  }" \
  "  location / {" \
  "    try_files \$uri \$uri/ /index.html;" \
  "  }" \
  "}" \
  > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
