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

## Lockfile repair receipt

- Non-breaking lockfile repair SHA: `2eeae8546ce3f6c2a6e56bf0f77d2fb97a7e1c97`.
- Repair mechanism: `npm audit fix --package-lock-only --omit=dev` on the PR branch only.
- Breaking/forced audit fixes remain prohibited.
- This receipt update intentionally retriggers the independent full container-hardening workflow on the repaired dependency graph.

- Full-graph non-breaking lockfile repair SHA: `dbef6c2f8636f0608630c9619bd2feef14f78677`; this extends compatible fixes to build/dev transitives without using `--force`.
