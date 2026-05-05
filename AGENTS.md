# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Timesheet Manager is a pnpm workspace monorepo with two apps:

| App | Path | Port | Framework |
|-----|------|------|-----------|
| API | `apps/api` | 3000 | NestJS + TypeORM |
| Web | `apps/web` | 5173 | Vue 3 + Vite |

PostgreSQL 16 runs in Docker on host port **5433** (not the default 5432).

### Starting services

1. **Database**: `pnpm db:up` (Docker Compose, requires Docker daemon running)
2. **Migrations + seed + both servers**: `pnpm dev` (or equivalently `pnpm demo`)
3. Alternatively start services individually:
   - `pnpm --filter api dev` (NestJS watch mode, port 3000)
   - `pnpm --filter web dev` (Vite dev server, port 5173)

The API global prefix is `/api/v1`. Health check: `GET /api/v1/health`.

### Docker daemon

In Cloud Agent VMs, Docker runs inside a container. The daemon must be started manually:

```sh
dockerd &>/var/log/dockerd.log &
sleep 3
```

The environment uses `fuse-overlayfs` storage driver and `iptables-legacy`.

### Seeded demo accounts

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@example.com | password123 |
| Approver | approver@example.com | password123 |
| Admin | admin@example.com | password123 |

### Testing

See `README.md` for the full command list. Quick reference:

- **Lint**: `pnpm lint`
- **Typecheck**: `pnpm typecheck`
- **Format check**: `pnpm format:check`
- **All static checks**: `pnpm static`
- **Unit tests**: `pnpm test` (runs both API Jest + Web Vitest)
- **API integration tests**: `pnpm --filter api test:integration` (requires running DB)
- **E2E tests**: `pnpm --filter web test:e2e` (requires full stack running)

### Pre-commit hook

The `.husky/pre-commit` hook runs `pnpm lint && pnpm typecheck`. Ensure these pass before committing.

### Environment variables

The API loads `.env.example` as fallback when `NODE_ENV !== 'production'`, so no manual `.env` file is needed for local dev. See `apps/api/.env.example` for all available variables.

### Gotchas

- The `pnpm-workspace.yaml` includes `onlyBuiltDependencies` for `bcrypt`, `@nestjs/core`, and `esbuild` to avoid interactive `pnpm approve-builds` prompts.
- TypeORM `synchronize: true` is never used; always create proper migrations via `pnpm --filter api migration:generate`.
- The web app proxies API calls in dev via Vite config — no CORS issues when running both locally.
