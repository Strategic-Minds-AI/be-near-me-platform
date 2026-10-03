# Observability and SLO

## Runtime SLO

Staging target:
- heartbeat interval: 5 minutes
- stale heartbeat threshold: <= 11 minutes
- health endpoint: /healthz
- readiness endpoint: /readyz
- queue retry budget: max 5 attempts, task-specific default 2
- dead-letter on exhausted/invalid work
- protected packets: blocked immediately, never retried as executable work

## Signals

- heartbeat timestamp/state
- last cycle duration
- processed/pass/fail/blocked counts
- production-watch status
- queue depth by state
- dead-letter count
- lease owner/expiry
- restart count
- optional control-plane receipt delivery status

## Alert candidates

Create an operator alert only when material:
- heartbeat stale
- readiness degraded for two consecutive cycles
- dead-letter created
- protected action awaiting approval
- lease cannot be reclaimed
- production watch fails
- container restart loop
- receipt bridge repeatedly unavailable

Routine success remains a receipt, not an alert.
