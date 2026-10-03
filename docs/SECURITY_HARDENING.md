# Security Hardening Standard

## Enforced now

1. Non-root web and worker containers.
2. Read-only filesystems and dropped capabilities.
3. No privileged mode and no host Docker socket.
4. Persistent worker carries no app `node_modules`.
5. Typed queue packets and an allowlisted runtime task registry.
6. Idempotency receipts.
7. Singleton lease.
8. Bounded retries and timeouts.
9. Dead-letter and blocked queues.
10. Protected action classes fail closed.
11. HTTP security headers.
12. Dependency lockfile builds.
13. CI fails on any HIGH or CRITICAL production dependency advisory.
14. Docker base images are digest-pinned at the validated candidate.
15. Dependabot covers npm, Docker, and GitHub Actions.
16. No secrets in repository files.
17. Super-Agent persistence and restart behavior is tested in CI.
18. Super-Agent readiness degrades when configured production watches fail.

## Dependency posture

The hardened application runtime gate is zero HIGH and zero CRITICAL findings under `npm audit --omit=dev`. Remaining MODERATE findings are tracked in `docs/DEPENDENCY_SECURITY.md` and must not silently increase.

## Deliberately not claimed

No software can be truthfully guaranteed "100% secure" or bug-free. Release readiness means all defined controls pass at one immutable SHA with zero known critical/high production dependency findings and no known critical functional failures.

## Remaining host-level controls before Railway production

- centralized log/alert bridge
- host/platform WAF and rate-limit policy where applicable
- secret rotation policy and drill
- volume backup/restore drill
- signed image/SBOM pipeline
- SAST/DAST baseline
- dependency-license review
- incident and rollback drills
