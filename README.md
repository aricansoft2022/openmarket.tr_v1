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
- `/onboarding/business-identity/evidence` — owner-authorized private manual-exception evidence management
- `/onboarding/business-identity/evidence/:evidenceId/download` — owner-authorized private evidence download
- `/admin/business-identity/reviews` — permissioned pending business-identity review queue
- `/admin/business-identity/reviews/:reviewId` — permissioned review detail and reasoned verify/reject action
- `/admin/business-identity/reviews/:reviewId/evidence/:evidenceId/download` — private Reviewer/Admin evidence download
- `/account/security` — authenticated provider list plus explicit Google link/unlink controls
- `/giris`, `/kayit` and `/kayit/basarili` — legacy redirects to canonical auth routes
- `/api/auth/*` — Better Auth resource handler
- `/health` — no-cache service health response with validated core metadata

Email verification and password-reset tokens are enabled. Their Turkish/English delivery contracts are written atomically to `outbox_events`; no external email sender is configured yet. Registration creates Better Auth identity data, `user_preferences` and the verification outbox event in one transaction.

Business identity is separate from authentication. A verified matching company-domain email may verify automatically; public-email domains require manual review, blocked domains are rejected and a separate company email remains pending. Buyer becomes active only after a verified business-identity review. A08 workspace selection may widen Buyer plus Supplier to Both but never silently removes a workspace.

A09 records the application and explains manual review. A10 reads current database state, shows rejection reasons, permits resubmission only after rejection and links eligible manual-exception applications to private evidence management. Evidence bytes are stored in the private R2 binding with internal object keys and owner-only session checks; uploading evidence does not approve the review or activate Buyer/Supplier.

Pending business-identity reviews use fixed platform staff assignments. Only active Compliance Reviewer, Platform Admin or Super Admin assignments can list, inspect or decide reviews and download private evidence. Buyer, Supplier, Product/RFQ Moderator and other unrelated states do not grant review authority. Staff cannot review their own application, revocation takes effect on the next request and privileged decisions record the effective role in immutable audit evidence. Staff grant/revoke management remains a separate Admin-only follow-up; Supplier activation remains separate.

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
npm run db:verify:business-identity-evidence
npm run db:verify:business-identity-review
npm run db:local:down
```

The verification chain covers immutable audit behavior, Better Auth persistence, transactional registration, recovery tokens, Google policy/linking, business-identity transitions, the authenticated A08–A10 workflow, the private evidence lifecycle and fixed-role reviewer authorization with real session cookies and a fake private R2 bucket.

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
