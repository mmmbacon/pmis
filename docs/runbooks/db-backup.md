# Database Backup Runbook

## Objective

For the v1 Fly.io deployment target, aim for:

- RPO: 24 hours
- RTO: 1 hour

## Backup

Run a daily logical backup with `pg_dump` from a trusted machine or scheduled Fly.io task:

```sh
pg_dump "$DATABASE_URL" --format=custom --file="timesheets-$(date +%F).dump"
```

Retain daily backups for 7 days and keep one weekly copy off-site. Production seed scripts are not run against production data.

## Restore

Create or identify the target PostgreSQL database, then restore:

```sh
pg_restore --clean --if-exists --dbname "$DATABASE_URL" timesheets-YYYY-MM-DD.dump
```

After restore, run the application smoke checks:

```sh
pnpm --filter api migration:show
curl https://<api-app>.fly.dev/api/v1/health
```

## Notes

If the app later scales beyond one instance or moves away from Fly.io, revisit backup scheduling, connection pooling, and restore drills.
