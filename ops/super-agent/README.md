# BNM Super-Agent Runtime

This is a durable worker, not a chatbot loop.

## Contract

`TRIGGER -> HEARTBEAT -> LEASE -> TYPED WORK PACKET -> SAFE EXECUTION -> RECEIPT -> NEXT ELIGIBLE ACTION`

The runtime automatically executes only READ, DRAFT, BRANCH_WRITE, and PREVIEW_WRITE packets from an allowlisted task registry. PROTECTED packets are moved to `queue/blocked` and emit a receipt.

There is no arbitrary shell task. Production release, default-branch merge, payments, secrets, DNS, permission escalation, destructive data operations, and customer communications are intentionally absent from the executor.

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

- `GET /healthz`
- `GET /readyz`
- `GET /status`

## Optional control-plane bridge

Set `CONTROL_PLANE_RECEIPT_URL` and `CONTROL_PLANE_TOKEN` at runtime only. Never commit tokens.

Local receipts remain durable even if the bridge is unavailable.
