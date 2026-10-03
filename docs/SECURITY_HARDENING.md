# Security Hardening Standard

## Enforced now

1. Non-root web and worker containers.
2. Read-only filesystems and dropped capabilities.
3. No privileged mode and no host Docker socket.
4. Typed queue packets and allowlisted worker task types.
5. Idempotency receipts.
6. Singleton lease.
7. Bounded retries and timeouts.
8. Dead-letter and blocked queues.
9. Protected action classes fail closed.
10. HTTP security headers.
11. Dependency lockfile builds.
12. Container CI and critical-vulnerability audit.
13. Dependabot for npm, Docker, and GitHub Actions.
14. No secrets in repository files.

## Deliberately not claimed

No software can be truthfully guaranteed "100% secure" or bug-free. Release readiness means every defined gate passes with zero known critical failures at the evaluated SHA.

## Remaining production hardening before container-host migration

- inventory exact CSP/connect-src domains before enforcing CSP
- centralize runtime logs and alerts
- external durable queue/control-plane bridge
- host-level WAF/rate limits
- secret rotation policy
- backup/restore drill
- container image registry with signed provenance/SBOM
- SAST/DAST baseline
- dependency-license review
- incident drill and rollback drill
