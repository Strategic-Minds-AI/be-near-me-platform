# syntax=docker/dockerfile:1.7
FROM node:25-bookworm-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370 AS deps
WORKDIR /app
ARG VITE_BASE44_APP_ID=6abd9e05a56938f03c2c557b
ENV VITE_BASE44_APP_ID=${VITE_BASE44_APP_ID} \
    PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0 AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
USER 101
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O- http://127.0.0.1:8080/healthz >/dev/null || exit 1
