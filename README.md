# SureCash Mining

A mobile-first earning platform: daily mining, AI-validated voice tasks, a task center, referrals with ongoing commission, gamification (levels/XP, streaks, achievements, leaderboards, lucky spin), multi-wallet balances, deposits/withdrawals, and a full admin panel. Built as a single Next.js app (App Router + API routes) with PostgreSQL/Prisma.

## Tech stack

- **Framework:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT in an httpOnly cookie, bcrypt password hashing, optional email-OTP 2FA
- **Voice AI:** pluggable provider interface — stub by default, or Whisper / Gemini / Azure Speech with API keys
- **Payments:** pluggable gateway interface — Paystack fully wired, Monnify/Korapay/PayVessel/Flutterwave as stubs to fill in with real credentials
- **PWA:** installable manifest + service worker (offline fallback, push-notification listener)

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
- `PAYSTACK_SECRET_KEY` — the only payment gateway with a real integration; others (`MONNIFY_*`, `KORAPAY_*`, `PAYVESSEL_*`, `FLUTTERWAVE_*`) are stub adapters ready for real credentials
- `EMAIL_PROVIDER` / `OTP_PROVIDER` — default to console logging; swap in Resend/Termii/Twilio adapters in `src/lib/notifications/`
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
- **Withdrawals** — bank-account add flow with automatic name resolution + OTP confirmation before a new account can receive payouts; admin approve (paid) / reject (auto-reversed to Main wallet).
- **Promo codes** — admin-issued codes users redeem once for bonus-wallet credit.
- **Support** — user-created tickets with admin replies, plus a static FAQ page.
- **Community feed** — a real-activity feed (withdrawals paid, voice approvals, achievements, referral bonuses) — never fabricated data.
- **Admin panel** — overview analytics, users (ban/tier), deposits, withdrawals, voice task management + flagged-recording review, Task Center management + proof review, fraud dashboard, promo codes, support tickets, broadcast notifications, settings.

## Security

- httpOnly JWT session cookie, SameSite=Lax
- `src/middleware.ts`: security headers, cross-origin POST/PUT/PATCH/DELETE blocking (CSRF), a global per-IP rate limit, with the Paystack webhook exempted
- Per-route rate limiting on register/login/voice-submit/OTP endpoints (in-memory — swap for Redis/Upstash before scaling to multiple instances)
- Device fingerprinting (client-side hash) + a heuristic VPN-suspicion signal, stored per device
- Full audit log (`AuditLog`) for auth events, admin actions, and withdrawals
- Fraud reports auto-created for duplicate/replay/synthesized-voice detections, reviewable from the admin Fraud Dashboard

## Known limitations / roadmap

Built as a solid, fully-working MVP — these are the pieces intentionally left as extension points rather than fully implemented, so nothing is silently missing:

- **Voice AI heuristics** (background-noise, replay, synthesized-voice detection) are labeled placeholder heuristics in `src/lib/voice-ai/detectors.ts` — solid enough to exercise the full pipeline, but a production deployment should replace them with a real audio-analysis/classifier pass.
- **Payment gateways**: only Paystack is a real integration; Monnify/Korapay/PayVessel/Flutterwave throw a clear "not configured" error until real API credentials are wired into `src/lib/payments/provider.ts`.
- **Push notifications**: the service worker listens for and displays pushes, but there's no server-side VAPID subscription/send flow yet — add `web-push` + a `PushSubscription` table to complete it.
- **USDT/crypto withdrawals** are not implemented (bank-account withdrawal only).
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
