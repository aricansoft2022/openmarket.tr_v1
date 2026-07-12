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
- `/auth/callback` — A03 Google result states
- `/auth/verify-email` — A04 verification-pending and resend state
- `/auth/verify-email/result` — A05 verification success/error state
- `/auth/forgot-password` — A06 enumeration-safe reset request
- `/auth/reset-password` — A07 reset form and token-error state
- `/onboarding/workspaces` — A08 authenticated Buyer/Supplier/Both selection
- `/onboarding/business-identity` — A09 business-identity submission and resubmission
- `/onboarding/business-identity/status` — A10 pending/verified/rejected status timeline
- `/account/security` — authenticated provider list plus explicit Google link/unlink controls
- `/giris`, `/kayit` and `/kayit/basarili` — legacy redirects to canonical auth routes
- `/api/auth/*` — Better Auth resource handler
- `/health` — no-cache service health response with validated core metadata

Email verification and password-reset tokens are enabled. Their Turkish/English delivery contracts are written atomically to `outbox_events`; no external email sender is configured yet. Registration creates Better Auth identity data, `user_preferences` and the verification outbox event in one transaction.

Business identity is separate from authentication. A verified matching company-domain email may verify automatically; public-email domains require manual review, blocked domains are rejected and a separate company email remains pending. Buyer becomes active only after a verified business-identity review. A08 workspace selection may widen Buyer plus Supplier to Both but never silently removes a workspace.

A09 currently records the application and explains manual review, but private document upload remains disabled until R2 authorization is implemented. A10 reads current database state, shows rejection reasons and permits resubmission only after rejection. Supplier activation remains separate.

Google OAuth is enabled only when both credentials contain non-placeholder values. Google-only signup, implicit linking, cross-email linking and provider profile overwrite are disabled. Explicit link and unlink require an authenticated session plus current-password re-verification and preserve at least one login method.

Auth-sensitive actions use a shared abuse-control policy. Local development bypasses external controls only when `APP_ENV=local`; preview and production fail closed when required Rate Limiting or Turnstile resources are missing.

Wrangler locally emulates the private R2 bucket and background Queue. Hyperdrive remains intentionally unconfigured until a real development binding exists; no fake resource ID is committed. Read `RUNTIME_CONFIGURATION.md` before adding bindings or secrets.

## Local database verification

Docker is optional and is needed only for PostgreSQL migrations and integration checks.

```bash
cp .env.example .env
npm run db:local:up
npm run db:verify
npm run db:verify:auth
npm run db:verify:registration
npm run db:verify:recovery
npm run db:verify:google
npm run db:verify:google-linking
npm run db:verify:business-identity
npm run db:verify:business-identity-onboarding
npm run db:local:down
```

The verification chain covers immutable audit behavior, Better Auth persistence, transactional registration, recovery tokens, Google policy/linking, business-identity transitions and the authenticated A08–A10 workflow with a real session cookie.

Use `npm run db:local:reset` only when you intentionally want to delete the local PostgreSQL volume. A future Neon development database will replace the local `DATABASE_URL` only for direct migrations and administrative scripts; Worker runtime traffic will use `HYPERDRIVE`.

## Verification

```bash
npm run verify
npm run config:check
npm run db:check
```

GitHub Actions applies all migrations and runs application plus PostgreSQL integration gates on every pull request and `main` push.

## Delivery discipline

Read `WORKFLOW.md`, `STATUS.md` and `HANDOFF.md` before starting work. Every PR that changes product behaviour, schema, seeds, security or operations must update the relevant handoff documents.
