# Be Near Me — Frozen Baseline Validation Packet

**Status:** RELEASE HOLD  
**Baseline SHA:** `c7d3f11e828f0ff0983406e32079a17598eabed0`  
**Baseline branch:** `baseline/c7d3f11-20261001`  
**Hardening branch:** `hardening/benearme-c7d3f11-20261001`  
**Repository:** `Strategic-Minds-AI/be-near-me-platform`  
**Baseline Vercel deployment:** `dpl_7ZdRWrvK5HcBJk8oGSk3d9UbNdHk`  
**Validation date:** 2026-10-01

## Governance

This packet freezes the evidence base only. No production release, domain/DNS change, secret change, billing action, destructive action, or production data/schema mutation is authorized by this document.

Autonomous code implementation must not self-certify. Code changes require an independent reviewer/validator before subsequent release progression. At the time of this audit, external independent validator integrations were quota-blocked, so code repair remains fail-closed.

## Verified baseline findings

### P0 / release blockers

1. **Production conveyor is not frozen.** After the baseline was locked, `main` advanced to `308f501c0e299f9ee8e79d74eda27c90bdbb9526` ("Implement viral video creator tool and navigation") and Vercel automatically deployed it to production as `dpl_GkXYPkb65VspXpzvMped9Juc7VtJ`.
2. **No independent code-validation gate is present in the repository.** Baseline has no `.github/workflows/*`, no tests/e2e suite, no GitHub Actions runs at the baseline SHA, and the only combined commit status is Vercel success.
3. **Dare/Truth record integrity is too permissive for reward-bearing workflows.** Retrieved RLS allows either participant to update the entire record. Sensitive state includes `status`, `reward_paid`, and for Dare `video_verified` / `verification_note`.
4. **The frontend bypasses the proof-validator agent.** The Dare initiator can directly set `video_verified=true` and `status=verified`; the Base44 `validator_agent` is not invoked by that inspected flow.
5. **Reward behavior and product copy disagree.** `processReward` marks `reward_paid=true` and creates a notification; no token transfer/mint/send was found in that function, while UI copy tells the user Infinity Coin was sent.
6. **Token generation behavior and product copy disagree.** The TokenGenerator creates a Base44 Token record with a prospective derived address and `status=defined`; it does not deploy an ERC-20 contract, while UI language says "Generate ERC-20 Token" / "Token generated."

### P1 / hardening blockers

7. **Client-side route refreshes fail.** Direct requests to `/Dares`, `/Truths`, `/Shorts`, and `/About` on the exact frozen Vercel deployment return HTTP 404. React defines these routes. No `vercel.json` exists at baseline.
8. **PWA / SEO foundation is incomplete.** `index.html` links `/manifest.json`, but it returns 404. `/service-worker.js`, `/sw.js`, `/robots.txt`, and `/sitemap.xml` also return 404.
9. **Type validation is incomplete.** `npm run typecheck` uses `jsconfig.json` with `checkJs:true`, but the include/exclude scope omits important code including `src/api`, `src/lib`, `src/components/ui`, and Base44 backend TypeScript functions.
10. **Donor-brand/runtime residue remains.** Confirmed at the frozen SHA:
    - `base44/config.jsonc`: `VidioTube`
    - Studio sidebar: "Back to Vidio" and "© 2024 Vidio Studio"
    - Premium surfaces: "Vidio Premium"
    - Notifications fallback: "Vidio"
    - StudioLive RTMP: `rtmp://live.vidio.app/live`
11. **Scraper data integrity problems.** The scheduled scraper runs at 06:00 and 18:00 ET, includes unrelated epoxy/concrete/DIY search terms, and assigns synthetic random view counts. Manual video scraper also assigns random views.
12. **Anonymous acquisition experience is empty at the frozen runtime.** Browser validation loaded the homepage without console errors, but the rendered state was "No videos yet / Upload a video to start the feed."

### P2 / validation debt

13. No repository-level regression tests were found.
14. No verified automated accessibility, visual-regression, performance, dependency-vulnerability, or browser E2E gate exists at the frozen SHA.
15. Local Playwright setup was unavailable in the validation environment; connected Cloud Browser DOM/accessibility checks worked, but screenshot capture hit the monthly integration limit.
16. Classic GitHub branch protection could not be inspected with the connected integration; repository rulesets endpoint returned no rulesets.

## Positive findings

- Exact frozen root deployment returns HTTP 200 and renders without captured console errors.
- Wallet creation/import code uses `ethers` in the browser; inspected code persists the public address only. Recovery phrase is held in client state/modal rather than explicitly written to Base44.
- Video/Short/Wallet/Token/Report/Strike entities have meaningful RLS boundaries, though Dare/Truth state-transition rules require hardening.
- The frozen branch and hardening branch both preserve the exact `c7d3f11` baseline independently of moving `main`.

## Required repair order

1. Establish independent code-review/test lane and CI checks; keep release fail-closed.
2. Add SPA routing fallback and route regression tests.
3. Move Dare/Truth protected state transitions behind server-side functions; remove broad client authority over reward/verification fields; test RLS/state-machine bypass attempts.
4. Make reward/token behavior truthful until real transfer/deployment exists, or implement the missing governed backend behavior separately.
5. Remove Vidio/VidioTube residue and invalid RTMP dependency.
6. Remove synthetic engagement metrics and unrelated scraper queries; verify scraper authorization/exposure.
7. Add deployment-neutral PWA assets; add robots/sitemap/canonical metadata only when the canonical domain is formally approved.
8. Expand type/lint/build coverage to backend and critical client modules.
9. Add browser desktop/mobile, accessibility, security, and E2E regression gates.
10. Independently validate the complete hardening branch before any merge/release request.

## Required release evidence

Release remains blocked until all applicable evidence exists:

- dependency install PASS
- lint PASS
- full-scope typecheck PASS
- production build PASS
- unit/regression PASS
- direct-route HTTP PASS
- RLS/state-transition security PASS
- authenticated and anonymous E2E PASS
- desktop/mobile browser PASS
- accessibility PASS
- console/network error PASS
- PWA asset PASS
- independent reviewer PASS
- independent tester PASS
- preview deployment PASS
- rollback reference captured
- explicit operator approval for production release

## Current verdict

**FAIL — RELEASE BLOCKED.**  
Branch-only planning, documentation, deterministic tests, and independently validated repairs are allowed. Production, domain/DNS, secrets, billing, real-token behavior, and release remain locked.
