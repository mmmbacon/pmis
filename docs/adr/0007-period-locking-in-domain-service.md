# 0007 Period Locking In Domain Service

## Context

Approved periods must be locked from edits. UI-only locking would be easy to bypass and would leave API behavior inconsistent.

## Decision

Enforce period locking in the timesheet domain service. Approved timesheets cannot be edited; correction requests are explicit state changes and audit logged.

## Consequences

The API remains the source of truth for period locking. The UI can reflect locked state for usability, but correctness does not depend on the browser.
