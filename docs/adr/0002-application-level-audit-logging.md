# 0002 Application-Level Audit Logging

## Context

Every state change to timesheets, approvals, projects, and users must be audit logged. The audit event should describe the actor, entity, action, and before/after state.

## Decision

Write audit events in application services inside the same TypeORM transaction as the state change. Do not use PostgreSQL triggers.

## Consequences

Audit behavior is explicit in the code path that performs the change. If the audit insert fails, the business change rolls back. The tradeoff is that new state-changing services must remember to call the audit service.
