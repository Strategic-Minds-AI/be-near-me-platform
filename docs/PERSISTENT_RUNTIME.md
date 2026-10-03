# Persistent Runtime Architecture

## Authority

- Production code lineage: GitHub `Strategic-Minds-AI/be-near-me-platform`
- Released production baseline: merge SHA `9d803a7c678120dd6de0b3822d0f8daa418e0894`
- Human-readable visual authority: BNM-EA-V1 Drive validation vault
- Durable worker: minimal containerized Super-Agent runtime
- Build/validation workers: ephemeral GitHub Actions or approved sandbox builders
- ChatGPT/Apex: operator cockpit; never the scheduler

## Runtime flow

`TRIGGER -> SINGLE HEARTBEAT -> SUPERVISOR LEASE -> QUEUE -> SAFE TASK -> RECEIPT -> VALIDATION -> NEXT ACTION`

Default reconciliation cadence is 5 minutes. Do not create multiple overlapping schedulers.

## Separation of duties

The 24/7 supervisor is deliberately not a build machine. It has no app dependency tree, no Docker socket, and no arbitrary-shell executor. Branch builds, linting, dependency resolution, and release validation run in disposable CI/build environments.

This separation reduces the attack surface of the continuously exposed process while preserving autonomous orchestration through durable work packets and receipts.

## Persistence

The `/data` volume persists queue, heartbeat, dead-letter, blocked, and receipt state across container restarts. For multi-host durability, configure the optional control-plane receipt bridge to an approved Base44/Supabase adapter endpoint.

## Monitoring

When `AGENT_WATCH_URLS` is configured, every reconcile cycle verifies those endpoints. A failed watch marks the heartbeat `degraded` and `/readyz` returns 503 until a healthy cycle restores readiness.

## Fail closed

Protected work cannot be executed by the worker. A protected packet is moved to the blocked queue and requires an external operator-approved release path.

## Railway/Vercel split

- Vercel remains the public web production authority unless explicitly migrated.
- Railway is the intended long-running Super-Agent host.
- Railway staging is the first runtime target.
- The web container proves portability; it is not an implicit DNS or hosting migration.


## X1 durable mode

Railway staging is intentionally stateless. Production-grade persistence is provided by the existing X1 AI Hub Staging Supabase control plane. When `X1_SUPABASE_URL`, `X1_TENANT_ID`, and the protected `X1_SUPABASE_SERVICE_ROLE_KEY` are configured, the worker switches from the local file queue to the atomic X1 queue/lease/execution/receipt RPCs.

See `docs/X1_DURABLE_CONTROL_PLANE.md`.
