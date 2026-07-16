# SureCash Mining

A mobile-first earning platform: daily mining, AI-validated voice tasks, a task center, referrals with ongoing commission, gamification (levels/XP, streaks, achievements, leaderboards, lucky spin), multi-wallet balances, deposits/withdrawals, and a full admin panel. Built as a single Next.js app (App Router + API routes) with PostgreSQL/Prisma.

## Tech stack

- **Framework:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT in an httpOnly cookie, bcrypt password hashing, optional email-OTP 2FA
- **Voice AI:** pluggable provider interface — stub by default, or Whisper / Gemini / Azure Speech with API keys
- **Payments:** pluggable gateway interface — Paystack fully wired, Monnify/Korapay/PayVessel/Flutterwave as stubs to fill in with real credentials
- **PWA:** installable manifest + service worker (offline fallback, real Web Push send/receive via VAPID)

## Getting started

```bash
npm install

# Postgres must be running and DATABASE_URL set in .env (see .env.example)
npx prisma migrate dev
npm run db:seed

npm run dev
```

Open http://localhost:3000. It redirects to `/login` when logged out, `/dashboard` for regular users, or `/admin` for admins.

### Seeded accounts

| Role  | Email                | Password      |
|-------|-----------------------|---------------|
| Admin | admin@surecash.app    | Admin@12345   |
| Demo user | demo@surecash.app | Demo@12345    |

The seed also creates: levels 1–7 (Beginner → Elite), achievement definitions, multi-language voice tasks (English, Nigerian Pidgin, French, Yoruba, Hausa, Igbo, plus a "word game" task), a set of Task Center tasks (some requiring admin-reviewed proof), daily missions, lucky-spin prizes, and a `WELCOME50` promo code.

## Environment variables

Copy `.env.example` to `.env` and fill in what you have. Everything not configured falls back to a safe stub (logs to console, or clearly marked "not configured" errors) so the app runs fully offline/locally without any paid API keys:

- `VOICE_AI_PROVIDER` — `stub` (default) | `whisper` | `gemini` | `azure`
- `PAYSTACK_SECRET_KEY` — the only payment gateway with a real integration (both deposits and instant withdrawal payouts); others (`MONNIFY_*`, `KORAPAY_*`, `PAYVESSEL_*`, `FLUTTERWAVE_*`) are stub adapters ready for real credentials
- `DEFAULT_PAYOUT_PROVIDER` — which gateway attempts instant withdrawal disbursement (`PAYSTACK` default | `MONNIFY` | `KORAPAY` | `PAYVESSEL`)
- `EMAIL_PROVIDER` / `OTP_PROVIDER` — default to console logging; swap in Resend/Termii/Twilio adapters in `src/lib/notifications/`
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — generate with `npx web-push generate-vapid-keys`; push send is a no-op until both keys are set
- `RECAPTCHA_SECRET_KEY` — reCAPTCHA verification on registration is a no-op until this is set

## Wallets

Every user has six wallets: **Main, Mining, Voice, Referral, Task, Bonus**. All balance changes go through `src/lib/server/wallet.ts`, which writes an immutable `WalletTransaction` ledger row for every credit/debit — this is the single source of truth for balances and history. Users can also transfer between their own wallets.

## Core modules

- **Auth** — register/login, email verification (gates mining/voice/tasks/withdrawals), optional phone verification, optional email-OTP 2FA, password change, login history, per-device tracking.
- **Daily mining** — 24h cooldown, streak-scaled reward, day-7/day-30 milestone bonuses, tier multiplier.
- **Voice AI tasks** — browser `MediaRecorder` capture → upload → transcription via the pluggable AI provider → duplicate-hash / replay-attack / background-noise / synthesized-voice heuristics → auto wallet credit or admin review queue for flagged clips.
- **Task Center** — simple auto-completing tasks (visit site, daily check-in, quiz) and proof-required tasks (follow/join social channels) that queue for admin approval.
- **Referrals** — signup bonus on email verification, plus an ongoing 10% commission whenever a referred user earns from mining/voice/tasks.
- **Gamification** — XP & levels with bonus payouts, achievement badges, daily missions, leaderboards (top earners/miners/referrers), daily lucky spin.
- **Membership tiers** — Free/Silver/Gold/VIP multiply voice-task daily limits and mining rewards, and reduce withdrawal fees. Admins change a user's tier from the Users table.
- **Deposits** — manual bank transfer with receipt upload (admin-approved) or instant gateway checkout (Paystack live; others stubbed).
- **Withdrawals** — two payout methods:
  - **Bank transfer**: adding a payout account is a real automatic-verification flow — pick the bank from a searchable list (`/api/banks`, Paystack's bank list when configured, a static fallback otherwise), type a 10-digit account number, and the account holder's real name resolves live as you type (debounced, no "Verify" button) via Paystack's bank-resolve API. Saving is blocked until it verifies (or, with no provider configured, the UI is upfront that the account will be manually reviewed instead). On request, the platform attempts **instant automatic disbursement** through the configured gateway (Paystack Transfer API is fully wired: creates a transfer recipient, initiates the transfer, and the webhook confirms `transfer.success`/`transfer.failed`); Monnify/Korapay/PayVessel are stub adapters.
  - **USDT**: add a wallet address on TRC20/ERC20/BEP20, format-validated automatically (no name-resolution equivalent exists for crypto). Manual payout only — there's no crypto disbursement gateway wired up, so these always queue for an admin to send manually and mark paid, with a flat network fee (admin-configurable) on top of the usual percentage fee, converted to an estimated USDT amount at an admin-configurable exchange rate.
  - Both methods require an OTP confirming the account/wallet owner authorized adding that payout destination, and both fall back gracefully to manual admin processing (retry auto-payout, move to "processing", mark paid, or reject with an automatic wallet reversal) without ever blocking the withdrawal request itself.
  - The withdrawal fee is genuinely admin-configurable from Settings (`withdrawal_fee_percent`, `withdrawal_min_amount`, `withdrawal_usdt_network_fee`, `usdt_ngn_rate` — see `src/lib/server/withdrawal-fee.ts`), with membership tiers applying a proportional discount multiplier on top of whatever base fee the admin sets.
- **Promo codes** — admin-issued codes users redeem once for bonus-wallet credit.
- **Support** — user-created tickets with admin replies, plus a static FAQ page.
- **Community feed** — a real-activity feed (withdrawals paid, voice approvals, achievements, referral bonuses) — never fabricated data.
- **Withdrawal tracking** — a visual Submitted → Processing → Paid stepper on both the user and admin side; admins can move a withdrawal into "processing" before marking it paid.
- **Security Center** — active session list with per-device and "sign out all other sessions" revocation (backed by a real DB-tracked `Session` model, not just the JWT), plus login history and device tracking.
- **Push notifications** — an installable-PWA service worker that displays real Web Push messages, backed by a real server-side send flow: users opt in from Profile → Notifications (browser permission + `PushSubscription` row), and every `notifyUser`/`broadcastNotification` call (withdrawals paid, voice approvals, admin broadcasts, etc.) also fires a push via `web-push` when `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` are configured — a no-op otherwise.
- **Admin panel** — overview stats, a dedicated Analytics page (7-day retention, verification/deposit conversion, most active users, voice AI success rate), users (ban/tier), deposits, withdrawals, voice task management (create/activate/delete + flagged-recording review), Task Center management + proof review, fraud dashboard (report queue + flagged-users/VPN-devices/multi-device aggregate views), promo codes, support tickets, segmented broadcast notifications (All/VIP/New/Inactive), settings.

## Security

- httpOnly JWT session cookie, SameSite=Lax, backed by a DB `Session` record checked on every request — sessions can be individually revoked or bulk-revoked ("log out other devices"), which a stateless JWT alone can't do
- `src/middleware.ts`: security headers, cross-origin POST/PUT/PATCH/DELETE blocking (CSRF), a global per-IP rate limit, with the Paystack webhook exempted
- Per-route rate limiting on register/login/voice-submit/OTP endpoints (in-memory — swap for Redis/Upstash before scaling to multiple instances)
- Device fingerprinting (client-side hash) + a heuristic VPN-suspicion signal, stored per device
- Full audit log (`AuditLog`) for auth events, admin actions, and withdrawals
- Fraud reports auto-created for duplicate/replay/synthesized-voice detections, reviewable from the admin Fraud Dashboard's report queue and aggregate views (most-flagged users, VPN-suspected devices, multi-device accounts)
- Voice task prompts are served in randomized order per request so recordings aren't predictable

## Known limitations / roadmap

Built as a solid, fully-working MVP — these are the pieces intentionally left as extension points rather than fully implemented, so nothing is silently missing:

- **Voice AI heuristics** (background-noise, replay, synthesized-voice detection) are labeled placeholder heuristics in `src/lib/voice-ai/detectors.ts` — solid enough to exercise the full pipeline, but a production deployment should replace them with a real audio-analysis/classifier pass.
- **Payment gateways**: only Paystack is a real integration (deposits via `src/lib/payments/provider.ts`, instant withdrawal payouts via `src/lib/payments/payout-provider.ts`); Monnify/Korapay/PayVessel/Flutterwave throw a clear "not configured" error until real API credentials are wired in, and automatic withdrawals simply fall back to the manual admin flow in that case.
- **USDT withdrawals are manual-only** — there's no real crypto disbursement/custody integration, so an admin always sends the USDT and marks it paid by hand (unlike bank withdrawals, which can auto-pay via Paystack).
- **SMS/WhatsApp notifications** are stub-only (console log) — swap in a real provider in `src/lib/notifications/otp.ts`.
- **Multi-level referral tree**: the referral dashboard shows direct referrals only, not a downstream tree.
- **Rate limiting** is in-memory (per-process) — fine for a single instance, needs a shared store (Redis) before horizontal scaling.

## Project structure

```
prisma/schema.prisma       — full data model
prisma/seed.ts             — demo data (levels, achievements, tasks, admin/demo users)
src/lib/server/            — wallet ledger, auth, gamification, referral commission, device/audit
src/lib/voice-ai/          — pluggable STT provider + duplicate/replay/noise detectors
src/lib/payments/          — pluggable payment gateway + bank verification
src/lib/notifications/     — pluggable email/OTP senders
src/app/api/               — all REST endpoints
src/app/(auth)/            — login/register
src/app/(app)/             — the mobile app shell (dashboard, mine, voice, wallet, profile, ...)
src/app/admin/             — the admin panel
src/middleware.ts          — security headers, CSRF check, global rate limit
public/manifest.webmanifest, public/sw.js — PWA
```
