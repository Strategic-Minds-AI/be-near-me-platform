# X1 Durable Control Plane for Be Near Me

## Purpose

Railway staging provides always-on compute. X1 AI Hub Staging Supabase provides durable queue, lease, execution-idempotency, and receipt state.

The worker never depends on Railway's ephemeral filesystem for authoritative state when X1 durable mode is configured.

## Existing staging authority

- Supabase project: `X1 AI Hub Staging`
- Tables:
  - `x1_work_queue`
  - `x1_task_leases`
  - `x1_execution_ledger`
  - `x1_audit_receipts`
- Atomic RPCs:
  - `x1_enqueue_work`
  - `x1_lease_next_work`
  - `x1_claim_execution`
  - `x1_complete_execution`
  - `x1_fail_execution`
  - `x1_finish_work`
  - `x1_heartbeat_apex_lease`

## Railway staging environment variables

Non-secret:
- `AGENT_PROJECT_ID=BNM-EA-V1`
- `AGENT_HTTP_PORT=8080`
- `AGENT_POLL_MS=300000`
- `AGENT_CONCURRENCY=1`
- `X1_SUPABASE_URL=https://uvdkzsbjackpjvpoxtyk.supabase.co`
- `X1_TENANT_ID=666f23bf-61bd-4be0-b5cb-4872e04fad9b`
- `X1_AGENT_ID=bnm-super-agent-staging`
- `X1_ENVIRONMENT=preview`
- `X1_LEASE_TTL_SECONDS=300`

Protected secret:
- `X1_SUPABASE_SERVICE_ROLE_KEY`

The service-role value must be injected through Railway's protected variable controls. It must never be committed, logged, written to receipts, or displayed by `/status`.

## Action-class translation

- X1 `READ_ONLY` -> BNM `READ`
- X1 `NON_PRODUCTION_MUTATION` -> BNM `PREVIEW_WRITE`
- X1 `PROTECTED_MUTATION` -> BNM `PROTECTED` -> blocked
- X1 `PRODUCTION_RELEASE` -> BNM `PROTECTED` -> blocked

Even an X1 queue item with approval metadata is not allowed to perform a protected mutation inside this worker.

## Durability

In X1 mode:
- work queue survives Railway restarts;
- leases are atomic in Postgres;
- execution idempotency is durable;
- completion/failure state is durable;
- audit receipts are durable;
- local `/data` remains only a diagnostic cache.

In local mode, the previously validated file-backed queue remains available for CI and development.
