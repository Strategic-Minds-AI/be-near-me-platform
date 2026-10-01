# Be Near Me — Base44 ↔ Supabase Compatibility Contract

Status: DRAFT / BRANCH-ONLY
Evidence baseline: GitHub main `c61b031020bd7a2831efcebddda2326eb984abca`
Base44 app: `6abd9e05a56938f03c2c557b`
WorkPacket: `6abda95dbeb5392e20be797d`

This document is a compatibility contract only. It does not authorize a production database migration, RLS change, secret change, production deployment, DNS change, public publishing, or default-branch merge.

## Source authority

For migration compatibility, the current Base44 entity definitions are the behavioral source contract until an explicitly approved migration supersedes them. The current Supabase SQL is a draft implementation and must not silently narrow IDs, fields, defaults, or access semantics.

Verified entity contracts inspected on the current Base44 app:
- `base44/entities/Channel.jsonc`
- `base44/entities/Video.jsonc`
- `base44/entities/ChannelMembership.jsonc`
- `base44/entities/LiveStream.jsonc`
- `base44/entities/Reaction.jsonc`
- `base44/entities/Notification.jsonc`

Draft migration surfaces inspected:
- `supabase/schema.sql`
- `MIGRATION.md`

## Blocking compatibility findings

### 1. Identifier type mismatch

Base44 entity references such as `channel_id`, `target_id`, `video_id`, and related record IDs are declared as strings. The current Supabase draft declares primary IDs and many relationship IDs as `uuid`.

Compatibility requirement:
- Do not require UUID-only identifiers unless every existing source ID is proven UUID-compatible and a deterministic translation/backfill plan is independently validated.
- The safest compatibility baseline is text identifiers for migrated Base44 IDs, with any new internal UUID kept in a separate column if desired.
- Preserve the original source ID losslessly and make idempotent imports key on that preserved identifier.

### 2. Ownership / identity mismatch

Base44 RLS rules use `created_by = {{user.email}}` and admin-role checks. The SQL draft uses `created_by_id uuid` and its example owner policy compares `auth.uid()` to that UUID column.

Compatibility requirement:
- Define one explicit identity mapping between Base44 authenticated email/user identity and Supabase auth identity before any entity is flipped.
- Preserve source creator identity during migration.
- Do not enable owner-write behavior until the mapping has deterministic tests for owner, non-owner, anonymous/public, and admin cases.

### 3. RLS parity is not implemented

The current SQL contains RLS instructions/examples as comments; it does not implement the inspected Base44 entity policies.

Required parity before migration:
- Channel: owner/admin read-write-delete as defined by source.
- Video: public read when `visibility = public`; owner/admin read-write-delete otherwise.
- ChannelMembership: owner, owning-channel context, or admin read; owner/admin mutation.
- LiveStream: public read only when `visibility = public` and `status = live`; owner/admin mutation.
- Reaction: owner/admin access per current source contract.
- Notification: owner/admin access per current source contract.

No RLS policy may be considered PASS from comments or intent alone; policies must exist in the target database and be tested independently.

## Material field parity gaps

### Channel

Current Base44 fields not represented in the SQL channel table include:
`country`, `videos_count`, `total_views`, `total_watch_time`, `tier`, `credits`, `earnings_balance`, `total_earnings`, `monetization_enabled`, `stripe_connect_id`, `links`, `featured_video_id`, `channel_trailer_id`, `status`, and `strikes`.

The SQL draft also contains fields such as `category` and `is_live` that are not part of the inspected Base44 Channel contract.

### Video

Current Base44 fields absent from the SQL video table include:
`thumbnails`, `renditions`, `captions`, and `metadata`.

`channel_id` is a source string but a SQL UUID in the draft.

### ChannelMembership

Current Base44 fields absent from the SQL table include:
`member_email`, `tier`, `price_cents`, `stripe_subscription_id`, `perks`, `badge_url`, `started_at`, `expires_at`, `months_subscribed`, and `description`.

The SQL draft adds `role`, which is not part of the inspected Base44 source contract.

### LiveStream

The SQL draft is materially narrower than the Base44 entity. Missing or non-equivalent source fields include:
`category`, `tags`, `stream_key`, `rtmp_url`, `hls_manifest_url`, `visibility`, `viewers_current`, `viewers_peak`, `total_views`, `likes`, `chat_enabled`, `chat_mode`, `slow_mode_seconds`, `monetization_enabled`, `superchat_enabled`, `scheduled_start`, `actual_start`, `ended_at`, `vod_video_id`, `channel_name`, and `channel_avatar`.

The SQL default `status = offline` is not in the inspected Base44 status enum (`scheduled`, `live`, `ended`, `processing`).

### Reaction

The source `target_id` is a string while SQL declares UUID. The source `description` field is absent from the SQL draft.

### Notification

The Base44 source uses `message`; the SQL draft uses `body`. Source fields absent from the SQL draft include:
`thumbnail_url`, `action_url`, `source_channel_id`, `source_channel_name`, `source_channel_avatar`, `video_id`, and `description`.

The SQL draft adds `target_id`, which is not part of the inspected source contract.

## Migration gate

An entity may switch from Base44 persistence to Supabase only when all of the following are evidenced:

1. Field parity: every source field is preserved, intentionally transformed with a documented mapping, or explicitly deprecated with operator approval.
2. ID parity: source IDs round-trip without loss or coercion failure.
3. Identity parity: creator/owner identity maps deterministically.
4. RLS parity: source-visible authorization behavior is reproduced and independently tested.
5. Default/enum parity: defaults and allowed values do not change behavior silently.
6. CRUD parity: create/read/filter/update/delete tests pass against representative source-shaped records.
7. Rollback: the entity can be switched back to Base44 without data loss or source-ID drift.
8. Preview validation: branch/preview tests pass before any protected production action is proposed.

## Recommended implementation order

1. Introduce compatibility-safe text source IDs and explicit creator identity fields in the branch-only schema draft.
2. Bring the six inspected entities to field/default/enum parity.
3. Implement RLS policies in a sandbox or preview database only.
4. Add deterministic contract tests for IDs, CRUD, filters, and RLS.
5. Migrate one low-risk entity in preview, validate, and record a receipt.
6. Do not enable `SUPABASE_ENABLED_ALL` until every entity has independent PASS evidence.

## Governance

Protected actions remain blocked without explicit scoped operator approval. In particular, this contract does not authorize running `supabase/schema.sql` against production, changing production RLS/schema, changing secrets, deploying production, changing DNS, publishing publicly, or merging to `main`.
