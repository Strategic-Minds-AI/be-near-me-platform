# Railway Staging Plan — BNM Super-Agent

## Existing authority

Railway project: Strategic Sandbox System
Project ID: `15f90272-e2f6-4739-8286-91447f545d71`
Staging environment ID: `d829fb35-5cdf-47a2-bd4f-134a1cf336d4`

Do not create a second Railway project.

## New staging service

Suggested name: `bnm-super-agent-staging`

Source:
- repo: `Strategic-Minds-AI/be-near-me-platform`
- validated branch/SHA: use the exact final PR #5 candidate
- Dockerfile: `Dockerfile.agent`

Runtime:
- Railway-provided `PORT`
- healthcheck path: `/healthz`
- restart policy: always/on-failure according to Railway supported settings
- replicas: 1
- cron: none
- public domain: not required for operation; expose only if needed for health/status access

Persistent volume:
- mount path: `/data`
- never put durable queue/receipts in the image layer

Non-secret variables:
- `AGENT_PROJECT_ID=BNM-EA-V1`
- `AGENT_SOURCE_SHA=<validated immutable SHA>`
- `AGENT_POLL_MS=300000`
- `AGENT_LEASE_MS=420000`
- `AGENT_CONCURRENCY=1`
- `AGENT_WATCH_URLS=https://be-near-me-platform.vercel.app/home,https://be-near-me-platform.vercel.app/manifest.json`

Optional protected runtime secrets:
- `CONTROL_PLANE_RECEIPT_URL`
- `CONTROL_PLANE_TOKEN`

Do not configure optional secrets until the destination and scope are verified.

## Staging acceptance

1. Railway deployment reaches healthy.
2. /healthz is 200.
3. /readyz becomes 200 after a healthy cycle.
4. /data volume survives service restart/redeploy.
5. safe packet writes PASS receipt.
6. duplicate packet remains idempotent.
7. PROTECTED packet is BLOCKED.
8. production watches pass.
9. no secret values appear in status/logs/receipts.
10. rollback/redeploy procedure is exercised before any production promotion.
