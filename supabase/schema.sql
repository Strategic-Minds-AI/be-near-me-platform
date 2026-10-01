-- ─────────────────────────────────────────────────────────────────────────
-- Be Near Me — Supabase schema (core tables)
-- Run this in the Supabase SQL editor. Tables mirror the Base44 entity
-- schemas. Built-in fields (id, created_date, updated_date, created_by_id)
-- are created here as columns. Enable Row Level Security and add policies
-- matching the access rules you want (public read for public content, owner
-- write for personal data, admin full access).
-- ─────────────────────────────────────────────────────────────────────────

-- Shared timestamp helper
create extension if not exists "pgcrypto";

-- Channels ────────────────────────────────────────────────────────────────
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  name text,
  handle text,
  description text,
  avatar_url text,
  banner_url text,
  category text,
  subscribers_count integer default 0,
  verified boolean default false,
  is_live boolean default false
);

-- Videos ──────────────────────────────────────────────────────────────────
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  title text not null,
  description text,
  url text not null,
  thumbnail_url text,
  poster_url text,
  duration numeric,
  category text,
  tags jsonb default '[]'::jsonb,
  language text default 'en',
  views integer default 0,
  likes integer default 0,
  dislikes integer default 0,
  comments_count integer default 0,
  visibility text default 'public',
  processing_status text default 'done',
  monetized boolean default false,
  ad_allowed boolean default true,
  age_restricted boolean default false,
  channel_id uuid,
  channel_name text,
  channel_avatar text,
  published_at timestamptz,
  scheduled_publish_at timestamptz
);

-- Shorts ───────────────────────────────────────────────────────────────────
create table if not exists public.shorts (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  title text,
  description text,
  url text not null,
  thumbnail_url text,
  duration numeric,
  views integer default 0,
  likes integer default 0,
  comments_count integer default 0,
  channel_id uuid,
  channel_name text,
  channel_avatar text,
  visibility text default 'public'
);

-- Comments ────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  video_id uuid,
  short_id uuid,
  parent_id uuid,
  text text,
  likes integer default 0,
  dislikes integer default 0,
  pinned boolean default false
);

-- Reactions ───────────────────────────────────────────────────────────────
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  target_type text,
  target_id uuid,
  reaction text
);

-- Subscriptions ───────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  channel_id uuid,
  email text,
  notifications_enabled boolean default true
);

-- Channel memberships ─────────────────────────────────────────────────────
create table if not exists public.channel_memberships (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  channel_id uuid,
  role text,
  status text
);

-- Watch history ───────────────────────────────────────────────────────────
create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  video_id uuid,
  video_title text,
  video_thumbnail text,
  channel_name text,
  watch_time numeric,
  duration numeric,
  progress numeric
);

-- Notifications ───────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  type text,
  title text,
  body text,
  target_id uuid,
  read boolean default false
);

-- Playlists ───────────────────────────────────────────────────────────────
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  title text,
  description text,
  visibility text default 'private',
  video_ids jsonb default '[]'::jsonb
);

-- Community posts ─────────────────────────────────────────────────────────
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  channel_id uuid,
  text text,
  image_url text,
  likes integer default 0,
  comments_count integer default 0
);

-- Live streams ────────────────────────────────────────────────────────────
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  channel_id uuid,
  title text,
  description text,
  stream_url text,
  thumbnail_url text,
  status text default 'offline',
  viewers_count integer default 0,
  started_at timestamptz
);

-- Live chat messages ───────────────────────────────────────────────────────
create table if not exists public.live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  live_stream_id uuid,
  author_name text,
  author_avatar text,
  text text
);

-- Superchats ──────────────────────────────────────────────────────────────
create table if not exists public.superchats (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  live_stream_id uuid,
  author_name text,
  text text,
  amount_cents integer default 0,
  currency text default 'usd'
);

-- Watch sessions ───────────────────────────────────────────────────────────
create table if not exists public.watch_sessions (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  video_id uuid,
  seconds_watched numeric,
  completed boolean default false
);

-- Dares ───────────────────────────────────────────────────────────────────
create table if not exists public.dares (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  initiator_email text not null,
  challenger_email text not null,
  challenge_text text not null,
  category text default 'kindness',
  infinity_coin_stake numeric default 0,
  status text default 'pending',
  video_url text,
  video_verified boolean default false,
  verification_note text,
  reward_paid boolean default false,
  expires_at timestamptz,
  completed_at timestamptz
);

-- Truths ───────────────────────────────────────────────────────────────────
create table if not exists public.truths (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  initiator_email text not null,
  responder_email text not null,
  truth_prompt text not null,
  infinity_coin_stake numeric default 0,
  status text default 'pending',
  response_text text,
  reward_paid boolean default false,
  expires_at timestamptz,
  revealed_at timestamptz
);

-- Strikes ─────────────────────────────────────────────────────────────────
create table if not exists public.strikes (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  user_email text not null,
  strike_number integer not null,
  reason text not null,
  type text not null,
  timeout_until timestamptz,
  removed boolean default false,
  tokens_redistributed boolean default false,
  charity_donation_percent numeric default 10,
  reannihilation_eligible_at timestamptz
);

-- Digital signatures ──────────────────────────────────────────────────────
create table if not exists public.digital_signatures (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  user_email text not null,
  user_name text not null,
  signature_text text not null,
  rules_version text not null,
  agreed_to_terms boolean default false,
  agreed_to_positivity_pledge boolean default false,
  agreed_to_crypto_terms boolean default false,
  charity_choice text,
  ip_address_hash text,
  signed_at timestamptz
);

-- Wallets ──────────────────────────────────────────────────────────────────
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  address text not null,
  chain text default 'ethereum',
  network text default 'mainnet',
  label text,
  balance_eth numeric default 0,
  last_checked_at timestamptz
);

-- Tokens ───────────────────────────────────────────────────────────────────
create table if not exists public.tokens (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  name text not null,
  symbol text not null,
  decimals integer default 18,
  total_supply text,
  contract_address text not null,
  network text default 'mainnet',
  wallet_id text,
  deployer_address text,
  status text default 'defined'
);

-- Creator reputation ──────────────────────────────────────────────────────
create table if not exists public.creator_reputations (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  channel_id uuid not null,
  score numeric default 0,
  level text default 'bronze',
  upload_consistency numeric default 0,
  watch_time_score numeric default 0,
  engagement_score numeric default 0,
  retention_score numeric default 0,
  growth_score numeric default 0,
  strikes integer default 0,
  reports_count integer default 0,
  monetization_eligible boolean default false,
  featured_eligible boolean default false,
  last_calculated timestamptz
);

-- Creator earnings ────────────────────────────────────────────────────────
create table if not exists public.creator_earnings (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  channel_id uuid,
  period text,
  gross_cents integer default 0,
  net_cents integer default 0,
  currency text default 'usd'
);

-- Payouts ──────────────────────────────────────────────────────────────────
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  channel_id uuid,
  amount_cents integer default 0,
  currency text default 'usd',
  status text default 'pending',
  paid_at timestamptz
);

-- Ad campaigns ────────────────────────────────────────────────────────────
create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  name text not null,
  advertiser_name text,
  type text default 'preroll',
  media_url text not null,
  thumbnail_url text,
  click_url text,
  duration numeric,
  skippable boolean default true,
  skip_after numeric default 5,
  budget_cents integer default 0,
  spent_cents integer default 0,
  cpm_cents integer default 500,
  impressions integer default 0,
  clicks integer default 0,
  completions integer default 0,
  targeting jsonb default '{}'::jsonb,
  schedule jsonb default '{}'::jsonb,
  status text default 'draft'
);

-- Premium subscriptions ────────────────────────────────────────────────────
create table if not exists public.premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  plan text,
  status text default 'active',
  started_at timestamptz,
  renews_at timestamptz,
  amount_cents integer default 0,
  currency text default 'usd'
);

-- Reports ──────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  created_by_id uuid,
  target_type text,
  target_id uuid,
  reason text,
  status text default 'open'
);

-- SEO / domain tables ──────────────────────────────────────────────────────
create table if not exists public.seo_reports (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  report_date date,
  site_url text,
  summary text,
  clicks_today integer default 0,
  clicks_prev integer default 0,
  clicks_change_pct numeric default 0,
  impressions_today integer default 0,
  impressions_prev integer default 0,
  impressions_change_pct numeric default 0,
  position_today numeric default 0,
  position_prev numeric default 0,
  position_change numeric default 0,
  ctr_today numeric default 0,
  ctr_prev numeric default 0,
  ctr_change_pct numeric default 0,
  top_queries jsonb default '[]'::jsonb,
  top_pages jsonb default '[]'::jsonb,
  health_status text default 'no_data',
  health_notes jsonb default '[]'::jsonb,
  generated_at timestamptz
);

create table if not exists public.domain_registry (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  domain text not null,
  canonical_url text,
  status text default 'onboarding',
  search_console_property text,
  ga4_property_id text,
  ga4_property_name text,
  sitemap_url text,
  competitors jsonb default '[]'::jsonb,
  target_keywords jsonb default '[]'::jsonb,
  target_geography text default 'US',
  health_score numeric default 0,
  last_analyzed_at timestamptz,
  next_action text,
  analysis_frequency_hours numeric default 6
);

create table if not exists public.domain_health (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  domain text not null,
  status text,
  expires_at timestamptz,
  created_at_domain timestamptz,
  registrar text default 'GoDaddy',
  nameservers jsonb default '[]'::jsonb,
  dns_records jsonb default '[]'::jsonb,
  locked boolean default false,
  synced_at timestamptz
);

create table if not exists public.sitemap_status (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  domain text not null,
  sitemap_url text,
  status text default 'missing',
  url_count integer default 0,
  sampled_urls jsonb default '[]'::jsonb,
  dead_urls jsonb default '[]'::jsonb,
  issues jsonb default '[]'::jsonb,
  last_checked_at timestamptz
);

create table if not exists public.competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  source_domain text not null,
  competitor_domain text not null,
  snapshot_date date not null,
  top_keywords jsonb default '[]'::jsonb,
  top_pages jsonb default '[]'::jsonb,
  content_strategy text,
  title_strategy text,
  identified_gaps jsonb default '[]'::jsonb,
  serp_position numeric,
  analysis_summary text,
  synced_at timestamptz
);

create table if not exists public.domain_actions (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  domain text not null,
  action_type text default 'other',
  priority text default 'medium',
  description text not null,
  status text default 'pending',
  auto_executable boolean default false,
  result text,
  receipt text,
  completed_at timestamptz
);

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  property_id text not null,
  property_name text,
  date date not null,
  sessions integer default 0,
  total_users integer default 0,
  page_views integer default 0,
  average_session_duration numeric default 0,
  engagement_rate numeric default 0,
  synced_at timestamptz
);

create table if not exists public.search_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  site_url text not null,
  date date not null,
  clicks integer default 0,
  impressions integer default 0,
  ctr numeric default 0,
  position numeric default 0,
  top_queries jsonb default '[]'::jsonb,
  top_pages jsonb default '[]'::jsonb,
  synced_at timestamptz
);

create table if not exists public.legal_references (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  title text not null,
  jurisdiction text,
  jurisdiction_detail text,
  compliance_area text,
  summary text not null,
  relevance text,
  url text,
  action_required text,
  compliance_status text default 'unknown',
  last_reviewed_at timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security: enable on all tables. Add policies per your access
-- rules. Example for public-read videos:
--
--   alter table public.videos enable row level security;
--   create policy "public read" on public.videos for select using (true);
--   create policy "owner write" on public.videos
--     for all using (auth.uid() = created_by_id);
-- ─────────────────────────────────────────────────────────────────────────

-- Realtime: enable for tables the app subscribes to
alter publication supabase_realtime add table public.videos;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.live_chat_messages;