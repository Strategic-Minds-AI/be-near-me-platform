# Railway Staging Runtime Contract

## Target

- Railway project: Strategic Sandbox System
- Project ID: `15f90272-e2f6-4739-8286-91447f545d71`
- Environment: `staging`
- Environment ID: `d829fb35-5cdf-47a2-bd4f-134a1cf336d4`
- Existing service donor: `agent-worker`
- Service ID: `b0162c7b-c387-4921-9dd1-145b0dae0793`

## Donor classification

The existing staging service is a placeholder:
- source image: `node:22-alpine`
- command: a console-log + idle interval loop
- no configured variables
- no durable volume

Classification: **REFACTOR / MIGRATE IN STAGING ONLY**.

Do not modify Railway production and do not create a second paid worker merely to duplicate this placeholder.

## Candidate source

- Repository: `Strategic-Minds-AI/be-near-me-platform`
- Branch: `apex/bnm-container-superagent-v1`
- Dockerfile: `Dockerfile.agent`
- Health path: `/healthz`
- Restart policy: `ALWAYS`
- Source SHA must be injected as `AGENT_SOURCE_SHA`.
- `AGENT_POLL_MS=300000` for the normal five-minute reconciliation contract.
- `AGENT_WATCH_URLS` should contain only operator-approved public health targets.

## Durable state requirement

The worker is not considered persistent until `/data` survives a real host/container restart.

Preferred options:
1. Attach a Railway persistent volume at `/data`.
2. Or replace the local queue with an approved durable Supabase/control-plane queue before declaring persistence.

Creating paid storage or other spend-bearing infrastructure remains a protected action and requires explicit approval.

## Staging validation

Before any production worker:
1. deploy the exact independently validated SHA to staging
2. verify `/healthz`, `/readyz`, and `/status`
3. enqueue one READ `runtime_snapshot` packet
4. enqueue one PROTECTED packet and prove it is blocked
5. restart the staging service
6. prove queue/receipt/heartbeat persistence
7. verify watch-url degradation/recovery
8. record deployment ID, service ID, environment ID, source SHA, and receipt hashes
9. keep public web authority on Vercel
10. require a new explicit approval before any Railway production action
