# 0005 Fly.io Application Target with Neon Postgres

## Context

The production target should be simple enough for a portfolio app and avoid Kubernetes or microservice infrastructure.

## Decision

Document Fly.io as the v1 application runtime and Neon as the managed PostgreSQL provider. The API and web app can be deployed as simple Fly apps, while production and review databases use Neon connection strings supplied through Fly secrets.

## Consequences

Deployment remains lightweight and close to the local Docker setup. Migrations run as an explicit deploy step. Backups target an RPO of 24 hours and RTO of 1 hour, documented in the database backup runbook. Pull request previews use Neon branches so review app data is isolated and can be deleted when the pull request closes.
