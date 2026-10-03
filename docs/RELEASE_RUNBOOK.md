# Release Runbook

1. Resolve immutable candidate SHA.
2. Build web and Super-Agent images.
3. Run container smoke validation.
4. Run targeted lint/build/type gates applicable to changed scope.
5. Verify no PROTECTED action is embedded in worker task registry.
6. Verify receipts, rollback pointer, and validation evidence.
7. Produce preview/staging deployment.
8. Independently validate preview identity and health.
9. Obtain explicit operator approval for protected merge/deploy.
10. Release one immutable SHA.
11. Re-fetch production deployment identity.
12. Run post-release smoke checks.
13. Emit release receipt.

Never let the implementation worker approve its own production release.
