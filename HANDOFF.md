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

Phase 0 was merged to `main` through PR #1. The repository contains a working SSR foundation, health route, Cloudflare Worker entry, queue contract, Drizzle/Hyperdrive connection helper, immutable audit schema and delivery documentation. No user-facing marketplace domain has been implemented yet.

The repository can be installed, verified, built and run at foundation level without Neon or a Cloudflare account. Default local development emulates the configured private R2 bucket and background Queue. `config/runtime-contract.json` records which integrations remain external.

Dependencies are pinned and reproducibly locked. CI uses read-only repository permissions and exposes formatting, documentation, runtime contract, types, tests and build as separate gates.

`DESIGN_REFERENCE.md` is reference-only. Do not copy the prototype hash router, mock authentication or mock data into production.

## Exact next tasks

1. Merge the runtime-contract PR after green CI.
2. Keep issue #2 open; its repository-side contract is prepared, but completion still requires a real development Neon database and Hyperdrive binding.
3. When database-backed work is approved:
   - provision isolated development Neon and Hyperdrive resources;
   - verify runtime PostgreSQL access through Hyperdrive and migrations through a direct Neon URL;
   - apply `drizzle/0000_fat_leo.sql` and prove update/delete attempts on `audit_logs` fail;
   - record non-secret identifiers, secret names without values, verification output and rollback steps.
4. Continue in dependency order:
   - #3 Better Auth persistence and request-scoped auth factory
   - #4 registration, verification and Google OAuth
   - #5 business identity, workspace selection and buyer activation
   - #6 supplier company profile, types and memberships
   - #7 private company-document upload and review
   - #8 supplier activation state machine
   - #9 fixed roles, permissions and route guards
   - #10 Phase 1 integration gate
5. Do not mix external infrastructure provisioning, auth persistence and onboarding UI in one PR.

## Verification commands

```bash
npm run format:check
npm run docs:check
npm run config:check
npm run typecheck
npm run test:run
npm run build
```

Database work additionally requires:

```bash
npm run db:check
npm run db:generate
```

Run `npm run db:migrate` only after checking the isolated development target.

## Known blockers

- No Neon development database or Hyperdrive configuration has been provisioned.
- Better Auth is installed but deliberately not configured until the request-scoped database lifecycle is tested.
- Cloudflare Images and Email Sending require account-level provisioning outside the repository.

These blockers do not prevent foundation development, local R2/Queue emulation, tests or production builds.
