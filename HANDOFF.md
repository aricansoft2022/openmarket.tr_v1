# Handoff

## Start here

Read, in order:

1. Run `npm run spec:materialize` and read `spec.full.md`
2. `STATUS.md`
3. `DECISIONS.md`
4. `ARCHITECTURE.md`
5. `DATA_MODEL.md`
6. `RUNTIME_CONFIGURATION.md`
7. `WORKFLOW.md`

Then inspect the current branch and run:

```bash
node --version
npm ci
npm run spec:materialize
npm run verify
npm run db:check
```

Node must satisfy the repository engine requirement. Do not replace `npm ci` with `npm install` in CI or documented verification flows unless the lockfile is intentionally regenerated in a dedicated dependency PR.

## Current state

Phase 0 and the runtime-configuration contract are merged to `main`. The repository contains a working SSR foundation, health route, Cloudflare Worker entry, queue contract, Drizzle/Hyperdrive connection helper, immutable audit schema and delivery documentation. No user-facing marketplace domain has been implemented yet.

The repository can be installed, verified, built and run at foundation level without Neon or a Cloudflare account. Default local development emulates the configured private R2 bucket and background Queue. An optional Docker Compose PostgreSQL service now provides repeatable migration and database-invariant checks without remote infrastructure.

Dependencies are pinned and reproducibly locked. CI uses read-only repository permissions and exposes application verification and PostgreSQL migration verification as separate jobs.

`DESIGN_REFERENCE.md` is reference-only. Do not copy the prototype hash router, mock authentication or mock data into production.

## Exact next tasks

1. Merge the local PostgreSQL verification PR after both CI jobs pass.
2. Keep issue #2 open for the remaining real Neon and deployed Hyperdrive evidence.
3. Start #3 as a narrow Better Auth schema and local persistence change:
   - generate and review only the required identity/session migrations;
   - keep the database lifecycle request-scoped;
   - test persistence against isolated PostgreSQL;
   - do not add registration screens or business activation logic.
4. Before remote Worker readiness is claimed:
   - provision isolated development Neon and Hyperdrive resources;
   - verify runtime PostgreSQL access through Hyperdrive and migrations through a direct Neon URL;
   - repeat the audit immutability verification against development Neon;
   - record non-secret identifiers, secret names without values, verification output and rollback steps.
5. Continue in dependency order through #4–#10.
6. Do not mix external infrastructure provisioning, auth persistence and onboarding UI in one PR.

## Verification commands

Foundation and application checks:

```bash
npm run format:check
npm run docs:check
npm run config:check
npm run typecheck
npm run test:run
npm run build
```

Optional local PostgreSQL verification:

```bash
cp .env.example .env
npm run db:local:up
npm run db:check
npm run db:verify
npm run db:local:down
```

`npm run db:verify` applies committed migrations and runs its audit mutation checks inside a rolled-back transaction. `npm run db:local:reset` is destructive and should only be used to intentionally delete the local database volume.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Better Auth is installed but not configured; schema and local persistence work may begin only after the local database gate merges.
- Cloudflare Images and Email Sending require account-level provisioning outside the repository.

These blockers do not prevent foundation development, local R2/Queue emulation, local PostgreSQL migration checks, tests or production builds.
