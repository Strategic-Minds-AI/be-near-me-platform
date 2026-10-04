# BNM Proof-Gate Repair Plan — 2026-10-04

Status: DRAFT ONLY
Source candidate: `apex/bnm-full-convergence-v1@be7af91652c2204aff533ca20f545bee948f43b9`
Independent proof receipt: `apex/proof-gate-v1@77c321d514e72ddf9d35601d5bb76eff7096f181`
Gate: `BNM-PROOF-GATE-V1`
Current result: FAIL

## Verified failure localization

The eight forbidden legacy import strings are all in `src/pages.config.js`:

- `./pages/Home`
- `./pages/Watch`
- `./pages/Channel`
- `./pages/Explore`
- `./pages/Trending`
- `./pages/Subscriptions`
- `./pages/Shorts`
- `./pages/Premium`

Fresh read of candidate `src/App.jsx` shows the runtime router uses the BNM/current route set and does not import `pages.config.js`.

Fresh read of candidate `src/lib/NavigationTracker.jsx` shows `pagesConfig` is used only for `Object.keys(Pages)` and `mainPage` page-name lookup for logging. It does not render or call the values stored in `PAGES`.

## Minimal proposed code repair

Do not implement until an independent validator returns PASS on this plan.

1. Remove only the eight forbidden imports above from `src/pages.config.js`.
2. Preserve the same eight object keys in `PAGES`, assigning `null` values so page-name lookup and `mainPage: "Home"` behavior remain stable.
3. Leave every non-forbidden import/key unchanged.
4. Re-fetch the exact diff.
5. Scan the repaired source for all eight forbidden import strings; expected count: 0.
6. Run deterministic build/tests.
7. Rerun the independent BNM proof gate against the exact repair SHA.
8. Preview-validate only after proof-gate PASS.

## Protected actions not authorized

No default-branch merge, production deploy, DNS change, secret/environment change, database/RLS/grant/function privilege change, payment/spend, permission escalation, destructive delete, or public/customer messaging.

## Independent validation blocker

A fresh request to the independent Validator was blocked by the platform safety layer before reaching the validator. This is an execution dependency, not a proof PASS.
