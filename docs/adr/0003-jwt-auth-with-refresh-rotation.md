# 0003 JWT Auth With Refresh Rotation

## Context

The app needs local username/password auth for a portfolio demo without introducing a third-party identity provider.

## Decision

Use bcrypt for password hashing, short-lived JWT access tokens, and longer-lived refresh tokens. Refresh tokens are rotated and the latest token hash is stored on the user record to stay within the requested eight-table schema.

## Consequences

The implementation remains small and local-demo friendly. A future multi-session model would require an explicit sessions table, which is intentionally not added in v1.
