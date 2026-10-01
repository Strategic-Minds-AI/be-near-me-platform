# BeNearMe metric/publication repair draft

WorkPacket: 6abda95dbeb5392e20be797d
Baseline: main c344ccd5df6142d4ea4ed346b8feb4d923e1a4aa
Target branch: repair/benearme-metric-publication-c344ccd-20261001

Required code changes:

1. base44/functions/autoScraper/entry.ts
- change imported Video visibility from public to private
- change fabricated random views to 0
- remove published_at assignment for unreviewed imports

2. base44/functions/scrapeVideos/entry.ts
- change imported Video visibility from public to private
- change fabricated random views to 0
- remove published_at assignment for unreviewed imports

Validation gates:
- refetch both files from the branch after modification
- assert neither file contains random-generated Video view counts
- assert imported records are not public by default
- assert no unrelated files changed
- run build/tests
- allow preview only after independent validation
- no main merge or production action without explicit scoped approval

Runtime evidence rechecked in this run:
- main remains c344ccd5df6142d4ea4ed346b8feb4d923e1a4aa
- repair branch is identical to main before this draft
- latest Vercel production is READY on c344ccd5df6142d4ea4ed346b8feb4d923e1a4aa
- Base44 app id 6abd9e05a56938f03c2c557b still contains the two unsafe import behaviors
- zero Video records were created in the 2026-10-01 17:50-18:20 ET scheduler window
- AI Hub Autonomous Tick remains enabled but last_run is null
