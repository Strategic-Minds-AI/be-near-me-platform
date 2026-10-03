# Security Policy

Report suspected vulnerabilities privately to the repository owners. Do not open a public issue containing exploit details, credentials, tokens, private user data, or payment information.

## Supported branch

Security fixes target the current production line and are independently validated before release.

## Secrets

No API keys, passwords, bearer tokens, private keys, processor secrets, or production credentials belong in source control. Use provider-managed runtime secrets.

## Money movement

BNM beneficiary settlement execution is fail-closed. Changes affecting payment or payout execution require explicit protected-action approval and independent validation.
