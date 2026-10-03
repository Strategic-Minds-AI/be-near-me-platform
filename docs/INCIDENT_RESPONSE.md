# Incident Response

## Severity

- SEV-1: security breach, unauthorized money movement, destructive data loss, production-wide outage.
- SEV-2: release regression, failed auth/payment flow without loss, persistent worker dead-letter exhaustion.
- SEV-3: isolated feature/runtime degradation.

## Immediate response

1. Preserve evidence.
2. Stop new protected actions.
3. Freeze the candidate SHA and deployment identity.
4. Revoke/rotate compromised credentials through the provider console when required.
5. Roll back only through a verified rollback pointer.
6. Validate recovery independently.
7. Document timeline, impact, cause, fix, and prevention.

The Super-Agent may detect and receipt an incident candidate. It may not autonomously rotate secrets, move money, delete data, or deploy production.
