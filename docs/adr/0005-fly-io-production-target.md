# 0005 Fly.io Production Target

## Context

The production target should be simple enough for a portfolio app and avoid Kubernetes or microservice infrastructure.

## Decision

Document Fly.io as the v1 production target. The API and web app can be deployed as simple apps, with PostgreSQL managed through Fly Postgres or an equivalent managed PostgreSQL 16 service.

## Consequences

Deployment remains lightweight and close to the local Docker setup. Migrations run as an explicit deploy step. Backups target an RPO of 24 hours and RTO of 1 hour, documented in the database backup runbook.
