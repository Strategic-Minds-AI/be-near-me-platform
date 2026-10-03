# BNM Super-Agent Runtime

This is a durable supervisor, not a chatbot loop and not a privileged build host.

## Contract

`TRIGGER -> HEARTBEAT -> LEASE -> TYPED WORK PACKET -> SAFE EXECUTION -> RECEIPT -> NEXT ELIGIBLE ACTION`

The persistent worker automatically executes only allowlisted observation/runtime tasks. It carries no app `node_modules`, has no Docker socket, and cannot run arbitrary shell commands.

Application build/lint/test/release work belongs in ephemeral CI/build workers. PROTECTED work remains operator-gated.

## Allowlisted persistent tasks

- `http_check`
- `file_check`
- `runtime_snapshot`

## Durable directories

- `/data/queue/pending`
- `/data/queue/working`
- `/data/queue/done`
- `/data/queue/blocked`
- `/data/queue/dead-letter`
- `/data/receipts`
- `/data/state/heartbeat.json`
- `/data/state/supervisor.lease.json`

## Health

- `GET /healthz` — process health
- `GET /readyz` — fresh, non-degraded heartbeat
- `GET /status` — redacted runtime state

## Production watch

Set `AGENT_WATCH_URLS` to a comma-separated set of HTTPS endpoints. Each reconcile cycle validates them and marks the heartbeat degraded on failure.

## Optional control-plane bridge

Set `CONTROL_PLANE_RECEIPT_URL` and `CONTROL_PLANE_TOKEN` at runtime only. Never commit tokens.

Local receipts remain durable even if the bridge is unavailable.
