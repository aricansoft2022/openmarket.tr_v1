# OpenMarket.tr

OpenMarket.tr is a free, donation-supported B2B directory and RFQ platform for home and contract textiles supplied from Türkiye.

## Source order

1. `spec.md` — version 2.1 source manifest; run `npm run spec:materialize` for the exact readable source
2. `DECISIONS.md` — accepted product and architecture decisions
3. `ARCHITECTURE.md` and `DATA_MODEL.md` — implementation boundaries
4. `STATUS.md` and `HANDOFF.md` — current execution state
5. `RUNTIME_CONFIGURATION.md` — local emulation, bindings and secret handling
6. `DESIGN_REFERENCE.md` — extracted visual reference only

## Stack

- React Router v8 + React + TypeScript
- Cloudflare Workers and the Cloudflare Vite plugin
- Drizzle ORM, Neon PostgreSQL and Cloudflare Hyperdrive
- Better Auth
- Cloudflare R2, Images, Queues, Turnstile, Rate Limiting and Email Sending
- PostgreSQL full-text search
- GitHub Actions and Wrangler

## Local setup

Requirements: Node.js 24 and npm. No remote service account is required for installation, verification, the current UI or the health route.

```bash
npm ci
npm run spec:materialize
npm run verify
npm run dev
```

The current application exposes:

- `/` — public foundation page and auth entry links
- `/auth/login` — A01 email/password login and guarded Google entry
- `/auth/register` — A02 registration with country, preferred language and intended use
- `/auth/google` — POST-only Google OAuth initiation
- `/auth/callback` — A03 Google success, unavailable, account-not-linked, rate-limited, security-unavailable and provider-error states
- `/auth/verify-email` — A04 verification-pending and resend state
- `/auth/verify-email/result` — A05 verification success/error state
- `/auth/forgot-password` — A06 enumeration-safe reset request
- `/auth/reset-password` — A07 reset form and token-error state
- `/giris`, `/kayit` and `/kayit/basarili` — legacy redirects to canonical auth routes
- `/api/auth/*` — Better Auth resource handler, including `/api/auth/callback/google`
- `/health` — no-cache service health response with validated core metadata

Email verification and password-reset tokens are enabled. Their Turkish/English delivery contracts are written atomically to `outbox_events`; no external email sender is configured yet. Registration creates Better Auth identity data, `user_preferences` and the verification outbox event in one transaction; intended use does not activate a buyer or supplier workspace.

Google OAuth is enabled only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` contain non-placeholder values. The provider requests OpenID, email and profile scopes. Google-only signup is disabled so required registration preferences cannot be bypassed. Same-email accounts are not silently linked, cross-email linking is forbidden and Google profile data does not overwrite OpenMarket profile data. Explicit authenticated account linking remains a later flow.

Registration, login, password recovery, verification resend, reset-password and Google initiation pass through a shared abuse-control policy. Local development bypasses external security services only when `APP_ENV=local`. Preview and production require the real `AUTH_RATE_LIMITER`; registration and recovery-sensitive forms also require `TURNSTILE_SITE_KEY` and the Worker-only `TURNSTILE_SECRET_KEY`. Missing remote security infrastructure fails closed rather than silently accepting requests.

Wrangler locally emulates the configured private R2 bucket and background Queue. Hyperdrive remains intentionally unconfigured until a real development binding exists; no fake resource ID is committed. Read `RUNTIME_CONFIGURATION.md` before adding bindings or secrets.

## Local database verification

Docker is optional and is needed only when you want to run PostgreSQL migrations and database integration checks locally. The default compose database is isolated development data and does not require Neon.

```bash
cp .env.example .env
npm run db:local:up
npm run db:verify
npm run db:verify:auth
npm run db:verify:registration
npm run db:verify:recovery
npm run db:verify:google
npm run db:local:down
```

`npm run db:verify` applies the committed Drizzle migrations, verifies the required audit indexes and proves that the database trigger rejects both UPDATE and DELETE operations on `audit_logs`.

`npm run db:verify:auth` verifies Better Auth signup, hashed credential storage, verification outbox creation, verified signin and persisted sessions. `npm run db:verify:registration` verifies required preference/outbox atomicity and duplicate-signup non-destruction. `npm run db:verify:recovery` verifies the email-verification gate, generic unknown-email reset response, password reset, session revocation, token replay rejection and expiry handling. `npm run db:verify:google` verifies credential gating, the Google authorization URL, state, callback URI, minimal scopes, client-secret protection and that OAuth initiation creates no identity or session.

Use `npm run db:local:reset` only when you intentionally want to delete the local PostgreSQL volume. Use `npm run db:local:logs` to inspect startup problems.

A future Neon development database will replace the local `DATABASE_URL` only for direct migrations and administrative scripts. Runtime Worker traffic will continue to use the `HYPERDRIVE` binding.

## Verification

```bash
npm run verify
npm run config:check
npm run db:check
```

GitHub Actions applies and verifies migrations, audit invariants, Better Auth persistence, transactional registration, auth recovery and Google OAuth policy against an isolated PostgreSQL service container on every pull request and `main` push. Unit tests also verify auth rate-limit decisions, Turnstile action matching, local-only bypass and remote fail-closed behaviour.

## Delivery discipline

Read `WORKFLOW.md`, `STATUS.md` and `HANDOFF.md` before starting work. Every PR that changes product behaviour, schema, seeds, security or operations must update the relevant handoff documents.
