# NestJS API (pnpm monorepo). Fly sets PORT; keep internal_port in fly.toml in sync.
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY apps/api ./apps/api
RUN pnpm --filter api build
RUN pnpm --filter api deploy --legacy /prod/api

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/api /app
EXPOSE 8080
CMD ["node", "dist/main.js"]
