# Persistent Runtime Architecture

## Authority

- Production code lineage: GitHub `Strategic-Minds-AI/be-near-me-platform`
- Released production baseline: merge SHA `9d803a7c678120dd6de0b3822d0f8daa418e0894`
- Human-readable visual authority: BNM-EA-V1 Drive validation vault
- Durable worker: containerized Super-Agent runtime
- ChatGPT/Apex: operator cockpit; never the scheduler

## Runtime flow

`TRIGGER -> SINGLE HEARTBEAT -> SUPERVISOR LEASE -> QUEUE -> SAFE TASK -> RECEIPT -> VALIDATION -> NEXT ACTION`

Default reconciliation cadence is 5 minutes. Do not create multiple overlapping schedulers.

## Persistence

The agent data volume persists queue, heartbeat, dead-letter, and receipt state across container restarts. For multi-host durability, configure the optional control-plane receipt bridge to the approved Supabase/Base44 adapter endpoint.

## Fail closed

Protected work cannot be executed by the worker. A protected packet is moved to the blocked queue and requires an external operator-approved release path.

## Railway/Vercel split

- Vercel remains the public web production authority unless explicitly migrated.
- Railway is appropriate for the persistent Super-Agent worker when a long-running service is required.
- The web container proves portability and supplies an escape hatch from platform lock-in; it is not an implicit production migration.
