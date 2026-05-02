# 0008 UUID Primary Keys

## Context

The schema should use durable identifiers that are safe to expose through APIs and easy to merge across environments.

## Decision

Use UUID primary keys on all core tables, defaulting to `gen_random_uuid()` from PostgreSQL's `pgcrypto` extension.

## Consequences

IDs are opaque and API-friendly. UUIDs are larger than integers, but the scale of this single-tenant app makes that tradeoff acceptable.
