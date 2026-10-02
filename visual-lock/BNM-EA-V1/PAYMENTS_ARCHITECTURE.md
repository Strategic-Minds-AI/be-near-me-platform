# Be Near Me Payments Architecture — Eva & Anastasia Beneficiary Model

## Objective
Replace placeholder monetization with a real, auditable payment/ledger system while preserving the approved app visuals.

## Existing donor assets
The current app already defines PremiumSubscription, CreatorEarning, Payout, Wallet, Stripe ID fields, Premium UI, Creator Earnings UI, and reward-processing concepts. Preserve/refactor these as donor assets; they are not proof of a live payment connection.

## Provider strategy
Primary contract: Stripe-compatible server-side payment adapter because the current data model already uses Stripe customer/subscription/connect/transfer identifiers. Base44 exposes no native Stripe connector for this app, so live Stripe must use a secure server-side adapter/API with secrets only in protected runtime environment variables. Square/Polar are optional alternative adapters and must never be silent substitutions.

## Required capabilities
- checkout session for premium / purchases
- customer + subscription lifecycle
- webhook signature verification
- payment/refund/dispute ledger
- deterministic net-receipt calculation
- 100% net receipt allocation to Eva & Anastasia beneficiary pool
- payout/transfer only to verified configured destination(s)
- idempotency for money-moving operations
- reconciliation against processor records

## Secret names — values never in source
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PUBLISHABLE_KEY
BNM_BENEFICIARY_POOL_MODE
BNM_BENEFICIARY_DESTINATION_ACCOUNT_ID
BNM_EVA_SHARE_BPS
BNM_ANASTASIA_SHARE_BPS

## Money flow
Customer payment -> processor -> verified webhook -> immutable receipt/ledger -> fees/refunds/taxes/pass-through classification -> platform net receipt -> 100% Eva & Anastasia Beneficiary Pool -> verified payout destination(s).

Platform retained share: **0%**.

## Safety
Code must not assume any beneficiary is legally eligible to own a processor account. If necessary, the verified destination can be a legally valid guardian/trust/custodial/entity arrangement configured outside the app. No live transfer occurs until that destination is verified.

## Required tests
checkout success/failure in test mode; duplicate webhook idempotency; refund/chargeback reversals; 0% retained-share invariant; 100% pool assignment; payout blocked if destination unverified; reconciliation; no client secrets; RLS/access negatives; no fabricated earnings.
