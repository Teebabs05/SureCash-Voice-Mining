# SureCash Mining

A mobile-first earning platform: daily mining, AI-validated voice tasks, a task center, referrals with ongoing commission, gamification (levels/XP, streaks, achievements, leaderboards, lucky spin), multi-wallet balances, deposits/withdrawals, and a full admin panel. Built as a single Next.js app (App Router + API routes) with PostgreSQL/Prisma.

## Tech stack

- **Framework:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT in an httpOnly cookie, bcrypt password hashing, optional email-OTP 2FA
- **Voice AI:** pluggable provider interface — stub by default, or Whisper / Gemini / Azure Speech with API keys
- **Payments:** pluggable gateway interface — Paystack fully wired; Monnify and Korapay wired but best-effort (see Known limitations); PayVessel/Flutterwave as stubs to fill in with real credentials
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
- `PAYSTACK_SECRET_KEY` — a real, confirmed integration (both deposits and instant withdrawal payouts)
- `MONNIFY_API_KEY` / `MONNIFY_SECRET_KEY` / `MONNIFY_CONTRACT_CODE` / `MONNIFY_WALLET_ACCOUNT_NUMBER` — deposits (checkout) and instant withdrawal payouts; best-effort, see Known limitations. Others (`KORAPAY_*`, `PAYVESSEL_*`, `FLUTTERWAVE_*`) are stub adapters ready for real credentials
- `BILLSTACK_SECRET_KEY` / `BILLSTACK_PUBLIC_KEY` / `BILLSTACK_WEBHOOK_SECRET` — dedicated virtual accounts for wallet funding (any transfer in is auto-credited) plus instant withdrawal payouts. **Best-effort, not confirmed against BillStack's real API** — see the warning in `src/lib/payments/billstack.ts`
- `DEFAULT_PAYOUT_PROVIDER` — which gateway attempts instant withdrawal disbursement (`PAYSTACK` default | `MONNIFY` | `KORAPAY` | `PAYVESSEL` | `BILLSTACK`)
- `EMAIL_PROVIDER` — defaults to console logging; swap in a Resend adapter in `src/lib/notifications/email.ts`
- `OTP_PROVIDER` — `console` (default) | `termii`, for the phone-verification SMS (bank/crypto/login OTPs always go by email — see Security Center). `TERMII_API_KEY` / `TERMII_SENDER_ID` configure it; best-effort, see Known limitations
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — generate with `npx web-push generate-vapid-keys`; push send is a no-op until both keys are set
- `RECAPTCHA_SECRET_KEY` — reCAPTCHA verification on registration is a no-op until this is set

## Wallets

Every user has six wallets: **Main, Mining, Voice, Referral, Task, Bonus**. All balance changes go through `src/lib/server/wallet.ts`, which writes an immutable `WalletTransaction` ledger row for every credit/debit — this is the single source of truth for balances and history. Users can also transfer between their own wallets.

## Core modules

- **Auth** — register/login, email verification (gates mining/voice/tasks/withdrawals), optional phone verification, optional email-OTP 2FA, password change, login history, per-device tracking.
- **Daily mining** — 24h cooldown, streak-scaled reward, day-7/day-30 milestone bonuses, tier multiplier.
- **Voice AI tasks** — browser `MediaRecorder` capture → upload → transcription via the pluggable AI provider → duplicate-hash / replay-attack detection, real RMS-based background-noise/silence analysis on decoded audio, and a synthesized-voice placeholder heuristic → auto wallet credit or admin review queue for flagged clips.
- **Task Center** — simple auto-completing tasks (visit site, daily check-in, quiz) and proof-required tasks (follow/join social channels) that queue for admin approval.
- **Referrals** — signup bonus on email verification, plus an ongoing 10% commission whenever a referred user earns from mining/voice/tasks. The dashboard also shows a downstream network tree (level 1/2/3 counts) via `src/lib/server/referral-tree.ts` — visualization only, commission is still single-level (paid to the direct referrer only).
- **Gamification** — XP & levels with bonus payouts, achievement badges, daily missions, leaderboards (top earners/miners/referrers), daily lucky spin.
- **Membership tiers** — Free/Silver/Gold/VIP multiply voice-task daily limits and mining rewards, and reduce withdrawal fees. Admins change a user's tier from the Users table.
- **Deposits** — manual bank transfer with receipt upload (admin-approved), instant gateway checkout (Paystack live; Monnify/Korapay wired but best-effort; PayVessel/Flutterwave stubbed), or a dedicated BillStack virtual account number (auto-credited via webhook on any transfer in — best-effort integration, see Known limitations).
- **Withdrawals** — two payout methods:
  - **Bank transfer**: adding a payout account is a real automatic-verification flow — pick the bank from a searchable list (`/api/banks`, Paystack's bank list when configured, a static fallback otherwise), type a 10-digit account number, and the account holder's real name resolves live as you type (debounced, no "Verify" button) via Paystack's bank-resolve API. Saving is blocked until it verifies (or, with no provider configured, the UI is upfront that the account will be manually reviewed instead). On request, the platform attempts **instant automatic disbursement** through the configured gateway (Paystack Transfer API is fully wired: creates a transfer recipient, initiates the transfer, and the webhook confirms `transfer.success`/`transfer.failed`); Monnify, Korapay, and BillStack are wired but best-effort/unconfirmed (see Known limitations); PayVessel is a stub adapter.
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
- Per-route rate limiting on register/login/voice-submit/OTP endpoints — Upstash Redis-backed when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set (required for correctness across multiple instances), in-memory fallback otherwise, and fails open to in-memory if Redis errors at runtime
- Device fingerprinting (client-side hash) + a heuristic VPN-suspicion signal, stored per device
- Full audit log (`AuditLog`) for auth events, admin actions, and withdrawals
- Fraud reports auto-created for duplicate/replay/synthesized-voice detections, reviewable from the admin Fraud Dashboard's report queue and aggregate views (most-flagged users, VPN-suspected devices, multi-device accounts)
- Voice task prompts are served in randomized order per request so recordings aren't predictable

## Known limitations / roadmap

Built as a solid, fully-working MVP — these are the pieces intentionally left as extension points rather than fully implemented, so nothing is silently missing:

- **Voice AI heuristics**: background-noise/silence detection is real signal analysis — webm/opus clips (Chrome/most Android, the common case) are decoded to actual PCM via `@audio/decode-webm` and checked against an RMS-energy threshold empirically calibrated by recording genuine silence/tone/noise through a real browser `getUserMedia` → `MediaRecorder` → Opus pipeline; clips that can't be decoded (e.g. Safari's `audio/mp4`) fall back to the old byte-level heuristic. Replay-attack detection is a real duplicate-hash lookup. Synthesized-voice detection remains a placeholder — genuine detection needs a trained classifier (e.g. a spectrogram-based model), which is a bigger lift than signal analysis alone.
- **Payment gateways**: Paystack is a real, confirmed integration (deposits via `src/lib/payments/provider.ts`, instant withdrawal payouts via `src/lib/payments/payout-provider.ts`); PayVessel/Flutterwave throw a clear "not configured" error until real API credentials are wired in, and automatic withdrawals simply fall back to the manual admin flow in that case.
- **Monnify integration is best-effort, not confirmed**: `api.monnify.com` was unreachable from this build environment's network policy (same restriction as BillStack/Termii), so `src/lib/payments/monnify.ts` is built from solid training knowledge of Monnify's long-documented public API rather than a verified live response — meaningfully more confident than the BillStack integration, but still worth testing against Monnify's sandbox before going live. Two specific things to double-check: the disbursement endpoint version (this uses v1; v2 can require OTP authorization above a configurable threshold) and the webhook signature header name/algorithm (`monnify-signature`, HMAC-SHA512 over the raw body). Verified everything else available from this sandbox: deposit init and withdrawal payout both fail cleanly (falling back to manual processing) when Monnify is unreachable, and a correctly HMAC-signed test webhook payload was confirmed to credit a wallet end-to-end.
- **Korapay integration is best-effort, not confirmed**: same restriction (`api.korapay.com` unreachable from this environment), so `src/lib/payments/korapay.ts` is built from training knowledge rather than a verified live response. The one detail most worth confirming: Korapay's webhook signature is coded to hash only the `data` portion of the payload (not the full raw body, unlike Paystack/Monnify) — get this wrong and legitimate webhooks silently fail signature verification. Verified the same way as Monnify: deposit init and withdrawal payout both fail cleanly when Korapay is unreachable (the withdrawal path exercised Korapay's own "declined" response branch specifically, not just a network exception), and a correctly HMAC-signed test webhook was confirmed to credit a wallet end-to-end.
- **BillStack integration is best-effort, not confirmed**: BillStack's docs (billstack.gitbook.io/api) were unreachable from the environment this was built in, so the virtual-account creation and transfer endpoint paths/field names in `src/lib/payments/billstack.ts` are inferred from public search fragments and standard Nigerian NUBAN-provider conventions, not verified against real API responses. The webhook (`src/app/api/webhooks/billstack/route.ts`) is authenticated via a shared-secret token in the URL rather than a confirmed signature scheme. Architecturally it's safe either way — a wrong endpoint just fails and falls back to manual processing, same as the other unconfigured gateways — but test it against BillStack's sandbox (or watch the first few real webhook payloads via the `[billstack:webhook]` console log) before trusting it with production traffic, and adjust the field-name guesses in that file if requests come back with an unexpected shape.
- **USDT withdrawals are manual-only** — there's no real crypto disbursement/custody integration, so an admin always sends the USDT and marks it paid by hand (unlike bank withdrawals, which can auto-pay via Paystack).
- **SMS provider (Termii) is best-effort, not confirmed**: like BillStack, `api.ng.termii.com` was unreachable from this build environment's network policy, so `src/lib/notifications/otp.ts`'s `TermiiOtpProvider` is built from stable training knowledge of Termii's long-documented public API rather than a verified live response. It's used only for the phone-verification-ownership SMS (not bank/crypto/login OTPs, which always go by email). A wrong field name surfaces as a clear thrown error, not a silent failure — test it against your Termii account before relying on it in production. WhatsApp notifications remain unimplemented.

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
