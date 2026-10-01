# BeNearMe Runtime Repair Build Packet

## Authority
- WorkPacket: `6abda95dbeb5392e20be797d`
- Canonical repository: `Strategic-Minds-AI/be-near-me-platform`
- Branch base SHA: `e63fc7e50be384c7d6fd459470c0be89bcfd10f3`
- Target branch: `convergence/benearme-runtime-repair-20261001`
- Production release: **BLOCKED pending explicit operator approval**

## Verified current state
- `main` latest observed SHA: `e63fc7e50be384c7d6fd459470c0be89bcfd10f3`
- Vercel project: `be-near-me-platform`
- Vercel project ID: `prj_jxtVozxaeJGjC0FDFQO4DB9E9f51`
- Latest observed deployment for the base SHA: `dpl_iP4pcjbeabQ3VdHFdk9k3bW5tcC5`, target `production`, state `READY`
- Base44 source candidate: app `6abd9e05a56938f03c2c557b`, display name `Vidio (Copy)`
- `index.html` is currently branded `BeNearMe` and uses the approved pink/magenta location-pin favicon
- `src/components/BrandLogo.jsx` contains the approved BeNearMe brand direction
- `vercel.json` is absent
- Prior runtime evidence: root route HTTP 200; direct `/Benchmark` route HTTP 404

## Drift classification
`REMOTE_AHEAD` relative to the previous convergence snapshot. Main is actively changing and each observed main push is currently generating a Vercel production deployment.

## Objective
Repair direct SPA route loading and remove verified residual donor branding without altering product behavior or production state.

## Scope
1. Add the smallest Vercel SPA rewrite needed so React Router direct routes resolve to `index.html`.
2. Preserve current BeNearMe favicon, title, theme color, and `BrandLogo.jsx`.
3. Search for residual `Vidio`, `VidioTube`, `Base44 APP`, or donor-template branding.
4. Change only verified user-visible donor branding. Do not rename backend identifiers blindly.
5. Keep all work on this branch and preview only.

## Validation
The connector path cannot literally enforce an independent validator after every individual line before the next line is written. Therefore this packet does **not** claim line-level validator compliance.

For any code/config change:
- minimize the diff,
- re-fetch the exact branch SHA after implementation,
- use an independent validator separate from the implementer,
- validate install/build/lint/typecheck where available,
- verify root and direct-route loading on a preview deployment,
- verify no new console/runtime errors,
- verify BeNearMe brand surfaces,
- fail closed on any validator rejection.

## Stop conditions
Stop immediately before:
- merging to `main`,
- direct writing to `main`,
- production deployment or alias changes,
- Vercel production-branch configuration changes,
- DNS/domain changes,
- secret/env changes,
- payments/spend,
- destructive deletion,
- public/customer messaging.

## Acceptance criteria
- Branch build succeeds.
- Direct route navigation succeeds in preview.
- Root route still succeeds.
- Brand remains BeNearMe.
- No protected action is executed.
- Independent validator returns PASS with evidence against the exact candidate SHA.
