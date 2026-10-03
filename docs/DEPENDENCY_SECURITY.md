# Dependency Security

## Gate

CI fails if `npm audit --omit=dev` reports any HIGH or CRITICAL production dependency finding.

At the pre-final hardening run on 2026-10-03, the production graph was reduced from 1 critical + 27 high findings to 0 critical + 0 high findings.

## Remaining moderate findings

The validated graph still reported three MODERATE findings:
- `mdast-util-to-hast`
- `react-router`
- `react-router-dom`

### Router context
The application is a browser SPA, not React Router SSR hydration. Navigation targets should remain internal/controlled; do not pass untrusted arbitrary backslash/protocol-relative URLs to Link/useNavigate. A future major Router migration must be separately tested.

### Markdown context
Any markdown/unified rendering path must not enable unsafe raw HTML without sanitization. Treat user-supplied markdown as untrusted.

## Supply-chain rules

- pin lockfile
- pin container base digest at a validated candidate
- keep build plugins in devDependencies
- override vulnerable transitives only within compatible semver contracts and rerun full CI
- remove unused dependencies rather than carrying them
- do not auto-merge dependency updates
- never lower the HIGH/CRITICAL gate to make CI green
