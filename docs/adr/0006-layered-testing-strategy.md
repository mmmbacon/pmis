# 0006 Layered Testing Strategy

## Context

The highest-risk behavior is domain workflow correctness, transactionality, and integration between the UI, API, and database.

## Decision

Use Jest unit tests for domain transition rules, supertest integration tests against PostgreSQL, Vitest for frontend behavior, and Cypress for the two required end-to-end flows.

## Consequences

Coverage focuses on risk instead of a percentage target. The suite has more setup than pure unit tests, but it exercises the real database and user flows that matter for this app.
