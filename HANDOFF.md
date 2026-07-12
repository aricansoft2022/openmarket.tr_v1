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
npm install
npm run spec:materialize
npm run verify
```

Node must satisfy the repository engine requirement.

## Current state

The repository foundation is intentionally small. It has a working SSR application, health route, Cloudflare Worker entry, queue contract, Drizzle/Hyperdrive connection helper, initial audit schema and workflow documentation. No user-facing marketplace domain has been implemented yet.

`DESIGN_REFERENCE.md` is reference-only. Do not copy the prototype hash router, mock authentication or mock data into production.

## Exact next tasks

1. Provision a development Neon database and create a Cloudflare Hyperdrive configuration.
2. Add environment-specific bindings without committing secrets.
3. Apply `drizzle/0000_fat_leo.sql` and verify that update/delete attempts on `audit_logs` fail.
4. Create Phase 1 issues in this order:
   - Better Auth schema and request-scoped auth factory
   - email/password registration and verification
   - Google OAuth
   - business identity/company-email verification
   - workspace selection and buyer activation
   - supplier company profile, types and memberships
   - private R2 document upload
   - document review and supplier activation state machine
   - fixed roles and permission guards
5. Keep the first Phase 1 PR limited to auth persistence and `/api/auth/*`; do not mix onboarding UI into it.

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

- No Cloudflare binding IDs or secrets are configured.
- No Neon database has been provisioned.
- Better Auth is installed but deliberately not configured until the request-scoped database lifecycle is tested.
- Cloudflare Images and Email Sending require account-level provisioning outside the repository.
