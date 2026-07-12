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

Requirements: Node.js 24 and npm. No remote service account is required for installation, verification, the foundation UI or the health route.

```bash
npm ci
npm run spec:materialize
npm run verify
npm run dev
```

The foundation application exposes:

- `/` — Phase 0 foundation page
- `/health` — no-cache service health response with validated core metadata

Wrangler locally emulates the configured private R2 bucket and background Queue. Hyperdrive remains intentionally unconfigured until a real development binding exists; no fake resource ID is committed. Read `RUNTIME_CONFIGURATION.md` before adding bindings or secrets.

## Local database verification

Docker is optional and is needed only when you want to run PostgreSQL migrations and database integration checks locally. The default compose database is isolated development data and does not require Neon.

```bash
cp .env.example .env
npm run db:local:up
npm run db:verify
npm run db:local:down
```

`npm run db:verify` applies the committed Drizzle migrations, verifies the required audit indexes and proves that the database trigger rejects both UPDATE and DELETE operations on `audit_logs`.

Use `npm run db:local:reset` only when you intentionally want to delete the local PostgreSQL volume. Use `npm run db:local:logs` to inspect startup problems.

A future Neon development database will replace the local `DATABASE_URL` only for direct migrations and administrative scripts. Runtime Worker traffic will continue to use the `HYPERDRIVE` binding.

## Verification

```bash
npm run verify
npm run config:check
npm run db:check
```

GitHub Actions also applies and verifies migrations against an isolated PostgreSQL service container on every pull request and `main` push.

## Delivery discipline

Read `WORKFLOW.md`, `STATUS.md` and `HANDOFF.md` before starting work. Every PR that changes product behaviour, schema, seeds, security or operations must update the relevant handoff documents.
