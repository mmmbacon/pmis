# Schema

The schema follows the eight-table model from `.plan/directions.md`.

## Tables

- `users`: UUID primary key, email, password hash, display name, refresh token hash, timestamps, and soft delete timestamp.
- `roles`: seeded role names `employee`, `approver`, and `admin`.
- `user_roles`: composite primary key linking users and roles.
- `projects`: project code/name/description, billable flag, project-level hourly rate for simple rate-derived reporting, timestamps, and archive timestamp.
- `tasks`: project task code/name and archive timestamp.
- `timesheets`: weekly aggregate for one user, period dates, status enum, submission and decision metadata.
- `timesheet_entries`: entries owned by a timesheet aggregate, with task, work date, numeric hours, and note.
- `audit_events`: application-level audit log with actor, entity, action, before/after JSONB, and timestamp.

## Invariants

- Timesheets are modified through the `timesheets` service, not by direct entry endpoints.
- Approved timesheets are locked from edits.
- Submitted timesheets can be approved or rejected only by users with `approver` or `admin`.
- Audit writes happen in the same TypeORM transaction as the state change.
- Hours use `numeric(5,2)`.
- UUIDs default to `gen_random_uuid()` through the `pgcrypto` extension.
- Migrations define all schema changes; TypeORM synchronization is disabled.

## Indexes

- Foreign keys are indexed.
- Timesheets are indexed by `user_id` and `period_start`.
- Timesheets are indexed by `status` for approval queues.
- Audit events are indexed by `actor_id` and by `(entity_type, entity_id)`.
