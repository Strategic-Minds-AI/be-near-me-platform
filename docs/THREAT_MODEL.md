# BNM Container / Super-Agent Threat Model

## Protected assets

- Be Near Me production code and deployment identity
- Base44 application data and user sessions
- payment/beneficiary records
- operator credentials and provider tokens
- durable worker queue, receipts, and leases
- visual/source-truth evidence

## Trust boundaries

1. Public browser -> Vercel frontend.
2. Frontend -> Base44 managed backend.
3. GitHub branch/CI -> disposable build environment.
4. Railway Super-Agent -> persistent /data volume.
5. Optional Super-Agent -> control-plane receipt bridge.

## Primary threats and controls

### Remote code execution in persistent worker
Control: no arbitrary-shell task, no app node_modules, no Docker socket, non-root, read-only root, all capabilities dropped.

### Queue poisoning
Control: strict project/action/task validation, bounded packet fields, path containment, URL protocol validation, idempotency hashes, dead-letter path.

### Duplicate/replayed work
Control: idempotency receipt lookup before execution and deterministic receipt keys.

### Concurrent workers
Control: singleton lease with expiry and reclaim rules.

### Production mutation
Control: PROTECTED actions fail closed; releases live outside the persistent worker.

### Secret leakage
Control: secrets are runtime-only environment values, redacted from /status, absent from receipts/source.

### Dependency compromise
Control: frozen lockfile, zero HIGH/CRITICAL production audit gate, digest-pinned bases, minimal persistent image.

### Monitoring blindness
Control: 5-minute heartbeat, configured URL watches, degraded readiness, durable cycle receipts.

## Residual risk

No runtime can eliminate provider compromise, kernel/container escape, compromised operator credentials, zero-day browser/backend vulnerabilities, or application logic defects. Those require provider security, credential hygiene, independent validation, backups, and incident/rollback drills.
