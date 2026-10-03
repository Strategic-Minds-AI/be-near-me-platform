# BNM-EA-V1 CONTAINER + SUPER-AGENT HARDENING RECEIPT

Timestamp: 2026-10-03

## Production baseline
- Repository: Strategic-Minds-AI/be-near-me-platform
- Production merge SHA: 9d803a7c678120dd6de0b3822d0f8daa418e0894
- Production host authority: Vercel
- Production release status: already released and unchanged by this hardening cycle

## Hardening branch
- Branch: apex/bnm-container-superagent-v1
- Candidate SHA: 517533312e47a637919bfc72e5b16cd5414b5c73
- Pull request: #5
- Pull request state: DRAFT / NOT MERGED

## GitHub Actions validation
- Workflow: container-hardening
- Workflow run: 37100949406
- Result: SUCCESS

Passed gates:
1. immutable dependency install
2. application build
3. production dependency audit
4. build-chain critical audit
5. X1 durable-store adapter validation
6. hardened web image build
7. hardened Super-Agent image build
8. Docker Compose smoke test
9. fail-closed PROTECTED action test
10. durable runtime state survives container restart
11. Super-Agent health/status verification
12. non-privileged container assertion
13. read-only root filesystem assertion
14. Linux capability drop assertion
15. no-new-privileges assertion
16. Docker socket absence assertion
17. cleanup

## Persistent Super-Agent runtime
Runtime contract:
TRIGGER -> HEARTBEAT -> LEASE -> TYPED WORK PACKET -> SAFE EXECUTION -> RECEIPT -> NEXT ELIGIBLE ACTION

Automatic action classes:
- READ
- DRAFT
- BRANCH_WRITE
- PREVIEW_WRITE

Fail-closed:
- PROTECTED
- production release
- payments
- secrets
- DNS
- destructive operations
- permission escalation

Task executor is allowlisted. No arbitrary shell task type is exposed.

## Railway staging
- Project: Strategic Sandbox System
- Project ID: 15f90272-e2f6-4739-8286-91447f545d71
- Environment: staging
- Environment ID: d829fb35-5cdf-47a2-bd4f-134a1cf336d4
- Service: agent-worker
- Service ID: b0162c7b-c387-4921-9dd1-145b0dae0793
- Source repo: Strategic-Minds-AI/be-near-me-platform
- Source branch: apex/bnm-container-superagent-v1
- Dockerfile: Dockerfile.agent
- Healthcheck: /healthz
- Restart policy: ALWAYS
- Region replicas: 1 in us-east4-eqdc4a
- Public staging domain: agent-worker-staging-a104.up.railway.app

## Durable storage
- Volume: agent-worker-data
- Volume ID: fda16f60-7bc3-4490-91d8-7bb0ef61594d
- Mount: /data
- Size reported by Railway: 50000 MB
- Purpose: queue, receipts, heartbeat, blocked jobs, dead-letter state
- Pending staged changes after apply: none

## Runtime identity
- AGENT_SOURCE_SHA pinned to:
  517533312e47a637919bfc72e5b16cd5414b5c73

Railway does not expose Dockerfile deployment commit metadata directly, so AGENT_SOURCE_SHA is the explicit runtime identity receipt.

## X1 durable adapter
- Adapter code validated in CI.
- Runtime enables X1 Supabase durability only when URL + tenant + service-role credential are all present.
- Current Railway connector confirms X1 variable names except the service-role credential name; therefore local Railway volume is the guaranteed durable staging layer at this receipt.
- No secret value is stored in this receipt.

## Governance
- Vercel remains public production authority.
- Railway staging is the long-running persistent worker authority.
- PR #5 must remain unmerged until separately approved.
- No production DNS, payment, secret, database migration, or production Railway environment change was performed in this hardening cycle.

## Rollback
- Public web rollback: last verified Vercel production deployment / Git revert PR.
- Worker rollback: Railway deployment rollback while preserving volume agent-worker-data.
- Never delete /data as part of normal rollback.

## Status
CONTAINER BUILD: PASS
DEPENDENCY SECURITY GATES: PASS
COMPOSE SMOKE: PASS
PERSISTENCE TEST: PASS
FAIL-CLOSED GOVERNANCE: PASS
RAILWAY STAGING DEPLOYMENT: PASS
RAILWAY DURABLE VOLUME: PASS
PRODUCTION CHANGE: NONE
PR #5 RELEASE: NOT APPROVED / NOT MERGED
