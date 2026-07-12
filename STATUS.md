# Project status

**Updated:** 2026-07-12  
**Source of truth:** `spec.md` version 2.1  
**Repository:** `aricansoft2022/openmarket.tr_v1`

## Current phase

Phase 1 — Identity and supplier activation foundation.

## Completed

- Merged Phase 0 foundation through PR #1 using a squash merge.
- Added the React Router v8 + Cloudflare Workers TypeScript scaffold.
- Added reproducible `package-lock.json` installation and read-only GitHub Actions CI.
- Added design tokens, source-of-truth preservation, architecture, data model, seed, test, workflow and handoff documentation.
- Created dependency-ordered Phase 1 issues #2–#10.
- Merged the runtime configuration contract and local R2/Queue emulation through PR #12.
- Merged optional local PostgreSQL and CI migration/audit-invariant verification through PR #13.
- Kept fake Cloudflare resource IDs and credentials out of source control.

## In progress

- #3 — Better Auth core schema, request-scoped Drizzle adapter and `/api/auth/*` handler.
- Verify email/password signup, credential-account storage, signin and session persistence against isolated PostgreSQL.
- Keep #2 open for the remaining remote Neon and deployed Hyperdrive verification.

No owner action is required for the current local or CI work.

## Verification

Current merged repository verification:

```text
npm run verify       PASS
npm run config:check PASS
npm run db:check     PASS
npm run db:verify    PASS
GET /                200, SSR markers present
GET /health           200, valid no-cache JSON payload
GitHub Actions        PASS: application + database jobs
```

The Better Auth persistence PR adds migration `0001_opposite_gorgon.sql` and a database integration check for signup, hashed credential storage, signin and sessions.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- Email verification delivery, password reset delivery, Google OAuth and Turnstile are intentionally deferred to #4.
- Buyer/supplier workspace intent and activation remain separate domain work in #5–#8.
- Email Sending authorization and Cloudflare Images account configuration remain external dashboard tasks.
- The static prototype remains a reference and does not replace production accessibility or responsive validation.

These are later integration or deployment blockers, not blockers for Better Auth schema and local persistence verification.

## Next tasks

1. Merge the Better Auth persistence PR after application and database CI jobs pass.
2. Start #4 with registration/login route UI, verification/reset contracts, Google OAuth and abuse controls.
3. Provision Neon and deployed Hyperdrive before claiming remote Worker database readiness.
4. Continue Phase 1 in dependency order through #5–#9.
5. Close Phase 1 through integration gate #10 before beginning catalogue work.
