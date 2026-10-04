-- BNM-FULL-AUTONOMOUS-CONVERGENCE-V2
-- DRAFT / BRANCH ONLY. Do not apply to production without explicit approval.
-- Native Be Near Me auth uses Supabase Auth. Google is not required.

create extension if not exists "pgcrypto";

create table if not exists public.membership_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  tier text not null check (tier in ('free','member_10','member_20')),
  status text not null default 'active' check (status in ('active','pending_payment','cancelled','refunded','revoked')),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'usd',
  payment_method text not null check (payment_method in ('free','stripe','crypto_testnet','crypto')),
  payment_receipt_id text,
  crypto_payment_receipt_id text,
  infinity_coin_enabled boolean not null default false,
  infinity_coin_membership_grant numeric not null default 0 check (infinity_coin_membership_grant >= 0),
  grant_status text not null default 'none' check (grant_status in ('none','pending_wallet','pending_token','pending_mint','committed','reversal_pending','reversed','blocked')),
  economics_version text not null,
  economic_decision text not null,
  activated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists membership_entitlements_payment_receipt_uidx
  on public.membership_entitlements(payment_receipt_id)
  where payment_receipt_id is not null and payment_receipt_id <> '';

create unique index if not exists membership_entitlements_crypto_receipt_uidx
  on public.membership_entitlements(crypto_payment_receipt_id)
  where crypto_payment_receipt_id is not null and crypto_payment_receipt_id <> '';

create table if not exists public.crypto_payment_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  idempotency_key text not null unique,
  membership_tier text not null check (membership_tier in ('member_10','member_20')),
  network text not null check (network in ('sepolia','mainnet')),
  chain_id bigint not null,
  tx_hash text not null unique,
  from_address text,
  to_address text not null,
  asset text not null,
  amount_atomic numeric not null,
  expected_usd_cents integer not null check (expected_usd_cents > 0),
  confirmations integer not null default 0 check (confirmations >= 0),
  status text not null default 'pending' check (status in ('pending','verified','failed','replayed','reversed')),
  verification_reason text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.token_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  idempotency_key text not null unique,
  membership_entitlement_id uuid references public.membership_entitlements(id),
  source_type text not null check (source_type in ('membership_grant','activity_reward','spend','stake','reversal')),
  source_id text not null,
  source_payment_receipt_id text,
  token_name text not null default 'Infinity Coin',
  token_symbol text not null default 'IC',
  amount numeric not null check (amount >= 0),
  direction text not null check (direction in ('credit','debit')),
  status text not null check (status in ('pending_wallet','pending_token','pending_mint','committed','reversal_pending','reversed','blocked')),
  wallet_id text,
  wallet_address text,
  contract_address text,
  network text not null default 'offchain' check (network in ('offchain','sepolia','mainnet')),
  transaction_id text,
  tx_hash text,
  reason text,
  validator_status text not null default 'UNKNOWN' check (validator_status in ('UNKNOWN','PASS','FAIL','BLOCKED')),
  validated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.membership_entitlements enable row level security;
alter table public.crypto_payment_receipts enable row level security;
alter table public.token_ledger_entries enable row level security;

drop policy if exists "membership read own" on public.membership_entitlements;
create policy "membership read own" on public.membership_entitlements
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "crypto receipts read own" on public.crypto_payment_receipts;
create policy "crypto receipts read own" on public.crypto_payment_receipts
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "token ledger read own" on public.token_ledger_entries;
create policy "token ledger read own" on public.token_ledger_entries
  for select to authenticated using (user_id = auth.uid());

-- No direct client INSERT/UPDATE/DELETE policies are created for economic tables.
-- Writes must come through the governed server/service-role path after validation.

-- Existing account-owned content tables should converge to auth.uid() ownership.
-- This migration intentionally does not rewrite production ownership yet.
