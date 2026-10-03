# Super-Agent Operating Contract

## Purpose

Keep Be Near Me observable and recoverable 24/7 without turning the persistent process into a privileged code executor.

## Runtime contract

`TRIGGER -> HEARTBEAT -> LEASE -> QUEUE -> ALLOWLISTED TASK -> RECEIPT -> MONITOR -> NEXT CYCLE`

## Automatic

- runtime snapshots
- file existence checks inside the immutable image
- HTTP/HTTPS health checks
- queue reconciliation
- idempotency/retry handling
- blocked/dead-letter classification
- heartbeat/readiness receipts
- optional receipt forwarding to an approved control-plane endpoint

## Delegated to ephemeral builders

- npm install/build/lint/test
- branch code generation
- container builds
- visual/browser validation
- dependency resolution
- preview deployment

## Operator-gated

- default branch merge
- production deploy/rollback
- production database/schema/RLS
- secrets
- DNS
- spend/payments
- live publishing
- customer/employee outbound
- permission escalation
- destructive actions

## Invariants

1. One active supervisor lease.
2. One authoritative heartbeat cadence.
3. No arbitrary shell task.
4. No Docker socket.
5. No production credentials in repository or image.
6. Every queue outcome produces a durable receipt.
7. Duplicate idempotency keys never repeat side effects.
8. Protected packets are never auto-executed.
