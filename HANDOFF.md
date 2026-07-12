# Handoff

## Start here

Read, in order:

1. Run `npm run spec:materialize` and read `spec.full.md`
2. `STATUS.md`
3. `DECISIONS.md`
4. `ARCHITECTURE.md`
5. `DATA_MODEL.md`
6. `WORKFLOW.md`

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

Dependencies are pinned and reproducibly locked. CI uses read-only repository permissions and exposes formatting, documentation, types, tests and build as separate gates.

`DESIGN_REFERENCE.md` is reference-only. Do not copy the prototype hash router, mock authentication or mock data into production.

## Exact next tasks

1. Work #2 — provision development Neon and Cloudflare resources.
2. Verify runtime PostgreSQL access through Hyperdrive and migrations through a direct Neon URL.
3. Apply `drizzle/0000_fat_leo.sql` and prove update/delete attempts on `audit_logs` fail.
4. Record non-secret resource identifiers, secret names without values, verification output and rollback steps.
5. Continue in dependency order:
   - #3 Better Auth persistence and request-scoped auth factory
   - #4 registration, verification and Google OAuth
   - #5 business identity, workspace selection and buyer activation
   - #6 supplier company profile, types and memberships
   - #7 private company-document upload and review
   - #8 supplier activation state machine
   - #9 fixed roles, permissions and route guards
   - #10 Phase 1 integration gate
6. Keep the first implementation PR limited to #2. Do not mix infrastructure provisioning with auth persistence or onboarding UI.

## Verification commands

```bash
npm run format:check
npm run docs:check
npm run typecheck
npm run test:run
npm run build
```

Database work additionally requires:

```bash
npm run db:check
npm run db:generate
```

## Known blockers

- No Cloudflare development binding IDs or secrets are configured.
- No Neon development database has been provisioned.
- Better Auth is installed but deliberately not configured until the request-scoped database lifecycle is tested.
- Cloudflare Images and Email Sending require account-level provisioning outside the repository.
