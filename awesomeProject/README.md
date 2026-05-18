# GoalSync Backend (Go + PostgreSQL)

Enterprise-grade, modular backend for Goal Setting & Tracking with:
- JWT auth + refresh tokens + RBAC
- Goal workflows (create, submit, approve/reject, unlock)
- Quarterly check-ins
- Secure middleware (rate limit, CORS, security headers)

## Architecture

- `main.go` - bootstrap, migrations, jobs, HTTP server
- `src/config` - environment config
- `src/database` - PostgreSQL + migrations
- `src/models` - relational models
- `src/repositories` - data access layer
- `src/services` - business logic layer
- `src/modules/*` - controller/handler layer by module
- `src/middleware` - auth/RBAC/rate-limit/logging/security
- `src/routes` - enterprise route registry
- `src/validations` - input validation schemas

## Quick Start

```bash
cp .env.example .env
go mod tidy
go run ./main.go
```

Server: `http://localhost:8080`
Health: `GET /health`


## Test

```bash
go test ./...
```

## Notes

- This build favors hackathon scalability with clean layering and extensible module boundaries.
- Redis caching and external queue adapters can be added behind the `services` layer without breaking API contracts.

