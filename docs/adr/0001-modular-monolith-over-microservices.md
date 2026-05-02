# 0001 Modular Monolith Over Microservices

## Context

This project is a small single-tenant portfolio application with tightly related timesheet, approval, audit, and reporting workflows.

## Decision

Use a NestJS modular monolith organized by bounded context instead of microservices.

## Consequences

The system is simpler to run, test, and deploy locally. Module boundaries still communicate engineering intent without adding distributed-system complexity.
