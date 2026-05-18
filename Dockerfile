# Multi-service container for Render: Go backend (8080) + Vite preview frontend (3000)

FROM golang:1.25.0-bookworm AS backend-builder
WORKDIR /app/awesomeProject

COPY awesomeProject/go.mod awesomeProject/go.sum ./
RUN go mod download

COPY awesomeProject/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/goalsync ./main.go

FROM node:22.12.0-bookworm-slim AS frontend-builder
WORKDIR /app/remix-of-goalsync-ascent

COPY remix-of-goalsync-ascent/package.json remix-of-goalsync-ascent/bun.lock* ./
RUN npm install

COPY remix-of-goalsync-ascent/ ./
RUN npm run build

FROM node:22.12.0-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/lib/postgresql/data \
  && chown -R postgres:postgres /var/lib/postgresql

COPY --from=backend-builder /out/goalsync /app/goalsync
COPY --from=frontend-builder /app/remix-of-goalsync-ascent /app/frontend
COPY docker/start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 8080 3000
CMD ["/app/start.sh"]
