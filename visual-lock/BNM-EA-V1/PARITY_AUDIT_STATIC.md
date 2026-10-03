# BNM-EA-V1 STATIC PARITY AUDIT

## Evidence identity
- Approved visual lock: BNM-EA-V1
- Reference screens: 10/10 PNGs, each 941 x 1672
- Production deployment: dpl_FQXS2BWVAX2kHNgeM7kGYRpVGwmL
- Production SHA: 85e2cdd53f2da1893b2fe18600cfc0c35f5c42f0
- Production aliases: be-near-me-platform.vercel.app
- Production state: READY
- Live route HTTP checks: 10/10 returned HTTP 200
- Screenshot runtime: BLOCKED
  - Xtreme Cloud Browser: monthly integration limit reached
  - isolated Chromium container: outbound DNS unavailable
  - Playwright package install: runtime network timeout
- This receipt is STATIC parity only. It must not be represented as screenshot/pixel PASS.

## Data integrity findings
- Public Video records currently include scraped YouTube seed content tagged `scraped`, `youtube`, `seed`.
- Public CommunityPost query currently returns 0 records.
- Production BNM surfaces must exclude seed/scraped donor content from user-facing feeds.
- No screen may invent users, partner relationships, monetary balances, event attendance, nearby counts, addresses, or earnings.

## Binding source
The ten approved PNGs remain the visual authority. Device chrome is reference-only; the app is edge-to-edge mobile.

## Screen matrix

| # | Screen | Static status | Exact repair |
|---|---|---|---|
| 01 | Home / For You | FAIL | Rebuild full-height media composition, top nearby/live chips, creator/follow block, action rail, caption/hashtags/music row; exclude scraped seed content. |
| 02 | Explore / Nearby | FAIL | Match dense map/pin composition, category rail, Nearby Today sheet and rows. Never invent coordinates; permission/no-location state must preserve geometry. |
| 03 | Kindness Challenge | FAIL | Match hero ratio, badge/title hierarchy, countdown/joined/reward stat row, numbered rules card, full-width gradient Join CTA. Use real Dare values or neutral unavailable state. |
| 04 | Create / Record | FAIL | Existing camera engine is functional but visually does not match the approved creator screen. Preserve camera engine; rebuild tool rail, mode rail, sticker strip, caption/chip area and Post controls to reference geometry. |
| 05 | Search / Results | FAIL | Match search field, category chips, creator rows, opportunity rows and event rows. Do not manufacture opportunity/event records; use verified entities or explicit empty sections. |
| 06 | Creator Profile | PARTIAL | Banner/avatar/stats/grid hierarchy exists. Tighten header, follow/share controls, badge row, tabs, stats spacing and 3-column media rhythm. |
| 07 | Creator Studio | PARTIAL | Core metric cards/real-data rule exists. Rebuild exact card geometry, post-performance panel, audience/impact mini charts, categories/rewards and quick actions. |
| 08 | AI Coach | PARTIAL | Chat/coach system exists. Match hero/avatar/status bubble, conversation card sizes, recommendation cards, prompt input, chips and top-tab state. |
| 09 | Rewards Marketplace | FAIL | Current catalog is too sparse and icon-based. Match points hero, featured carousel/card proportions, filter row, 2-column reward grid. Only verified/internal rewards may be redeemable. |
| 10 | Checkout / Claim Reward | FAIL | Match product summary, delivery selector, verified address/pickup state, order summary, points method, full-width claim CTA and trust row. No invented shipping address or partner. |

## Release gate
- Current production is NOT approved as BNM-EA-V1 final visual parity.
- Do not merge rollback PR #3 automatically.
- Repair branch: apex/bnm-ea-v1-parity-repair
- Build and preview only until independent screenshot evidence is available.
- Final visual release requires >=94/100 binding contract threshold and 0 critical failures.
