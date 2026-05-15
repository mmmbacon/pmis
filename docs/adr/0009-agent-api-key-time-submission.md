# 0009 Agent API Key Time Submission

## Context

Agents working on this repository need a discoverable API for logging time against project tasks. Human users already submit time through weekly timesheets, and the API enforces important invariants there: entries belong to a weekly aggregate, approved periods are locked, submission is stateful, and changes are audit logged in the same transaction.

The system also needs administrator-managed API keys so agents can authenticate without a human login session. Administrators should be able to create agent identities and issue or revoke keys from the web settings UI.

## Decision

Add first-class agent identities that own their own timesheets. Each agent will have a backing synthetic `users` row for compatibility with existing timesheet, approval, reporting, and audit flows, plus dedicated agent metadata and hashed API keys.

Configure OpenAPI for the Nest API so agents can discover the available schemas and authentication requirements through `/api/v1/openapi.json` and human operators can inspect `/api/v1/docs`.

## Data Model

Add an `AgentsModule` with two new entities and a TypeORM migration:

- `agents`: `id`, `name`, `description`, `user_id`, `created_by`, `disabled_at`, `created_at`, and `updated_at`.
- `agent_api_keys`: `id`, `agent_id`, `name`, `key_prefix`, `key_hash`, `last_used_at`, `revoked_at`, `created_at`, and `updated_at`.

`agents.user_id` is a unique foreign key to `users.id`. The backing user receives the `employee` role, a synthetic unique email such as `agent+<agent-id>@agents.local`, and a random unusable password hash. Agents do not receive normal login credentials.

Store only API key hashes. Return the raw key exactly once when an administrator issues it.

## API Shape

Admin endpoints use the existing JWT and role guard pattern:

- `GET /api/v1/agents`
- `POST /api/v1/agents`
- `PATCH /api/v1/agents/:id`
- `POST /api/v1/agents/:id/api-keys`
- `POST /api/v1/agents/:id/api-keys/:keyId/revoke`

Only users with the `admin` role can call these endpoints.

Agent endpoints use an API key bearer token:

- `GET /api/v1/agent/me`
- `GET /api/v1/agent/tasks`
- `POST /api/v1/agent/time-entries`

The submission body should start with this contract:

```json
{
  "taskId": "uuid",
  "workDate": "2026-05-15",
  "hours": 1.25,
  "note": "Implemented API key guard for agent time logging",
  "mode": "append",
  "submitWeek": false
}
```

`mode` supports `append` and `replace`, defaulting to `append`. `submitWeek` defaults to `false`.

## Authentication

Add an `AgentApiKeyGuard` instead of extending JWT behavior. The guard validates `Authorization: Bearer <agent-api-key>`, looks up the public key prefix, verifies the secret against the stored hash, rejects revoked keys and disabled agents, and attaches an agent principal to the request with `agentId`, `userId`, `name`, and `keyId`.

Use a key format with a stable prefix, for example `pmis_agent_<publicPrefix>_<secret>`, so lookup can happen by prefix while preserving secret entropy.

## Timesheet Behavior

Do not create a separate standalone time entry model. Agent time must flow through the existing timesheet aggregate.

Add a focused method to `TimesheetsService` for single-entry agent logging. It should:

- Compute the Monday-Sunday week containing `workDate`.
- Load or create the agent user's draft timesheet for that week.
- Validate that the task exists and the timesheet is editable.
- Append or replace the matching `(workDate, taskId)` entry.
- Preserve existing entries on the same weekly draft.
- Optionally submit the week by reusing the existing submit transition.
- Record audit events in the same transaction.

Approved and submitted timesheets remain locked according to the existing domain policy.

## Web UI

Expand `SettingsPage.vue` into separate sections:

- Personal settings: keep the existing local theme selector.
- Agent management: admin-only server-backed UI.

The agent management section should list agents, show active/revoked key summaries, create agents, issue new keys, revoke keys, and disable agents. Newly issued raw keys should appear in a one-time copyable panel and should not be recoverable after the page is refreshed.

Add matching types and client methods in the web API layer.

## OpenAPI

Add `@nestjs/swagger` and configure the document in `main.ts`.

Document both authentication schemes:

- `bearer-jwt` for human web/admin endpoints.
- `agent-api-key` for `Authorization: Bearer <agent-api-key>` agent endpoints.

Decorate the new DTOs and controllers with examples so an agent can discover the required request body from the OpenAPI document without reading the source.

## Consequences

Agent time appears in current reporting, approvals, and audit trails because agents own normal timesheets through a backing user record.

API keys can be rotated and revoked independently of human JWT sessions. The tradeoff is additional lifecycle code for synthetic users, agent records, and hashed keys.

The time-entry endpoint remains simple for agents, while the service layer preserves the existing weekly timesheet rules.

## Implementation Notes

Suggested execution order:

1. Add Swagger/OpenAPI dependency and bootstrap configuration.
2. Add `Agent` and `AgentApiKey` entities, migration, module, service, and DTOs.
3. Add admin-only agent and key management endpoints.
4. Add the API-key guard and agent-facing `me`, `tasks`, and `time-entries` endpoints.
5. Extend `TimesheetsService` with single-entry append/replace logging.
6. Add integration tests for agent creation, key issuance, key revocation, disabled agents, time logging, and reporting totals.
7. Expand the web settings page with admin-only agent management.
8. Update schema/API docs and run lint, typecheck, and test suites.
