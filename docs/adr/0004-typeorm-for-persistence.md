# 0004 TypeORM For Persistence

## Context

The backend stack calls for NestJS, TypeScript, PostgreSQL, and migrations from day one.

## Decision

Use TypeORM with explicit entities, repositories, QueryBuilder for reporting, and hand-written migrations.

## Consequences

TypeORM integrates cleanly with NestJS modules and PostgreSQL migrations. Prisma and Drizzle are not used because the directions require TypeORM and because TypeORM's repository model is a good fit for this small modular monolith.
