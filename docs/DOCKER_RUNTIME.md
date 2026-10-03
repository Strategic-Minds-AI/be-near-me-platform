# Docker Runtime

## Local

```bash
docker compose build
AGENT_SOURCE_SHA=$(git rev-parse HEAD) docker compose up -d web super-agent
docker compose --profile validation run --rm validator
docker compose ps
```

Web: http://localhost:8080

## Security defaults

- non-root processes
- read-only root filesystems
- all Linux capabilities dropped
- `no-new-privileges`
- writable tmpfs only where required
- persistent agent data isolated to one named volume
- no Docker socket mounted into the Super-Agent
- no arbitrary shell task type
- secrets accepted only through runtime environment injection

## Production note

Do not point public DNS at the container until a separate release approval validates the target host, TLS, health checks, scaling, logs, backup, rollback, and secret configuration.
