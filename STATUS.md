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
- Merged Better Auth core schema, request-scoped Drizzle adapter, `/api/auth/*` handler and signup/signin persistence verification through PR #14.
- Merged transactional `user_preferences`, canonical A01/A02 entry forms and rollback verification through PR #17.
- Kept fake Cloudflare resource IDs and credentials out of source control.

## In progress

PR #19 advances issue #4 with:

- canonical A04–A07 verification and password-recovery routes;
- required email verification before email/password signin;
- transactional `outbox_events` for Turkish/English verification and reset delivery contracts;
- one-hour, single-use verification/reset tokens;
- password-reset session revocation;
- enumeration-safe unknown-email reset behaviour;
- migration `drizzle/0003_thankful_scrambler.sql` and PostgreSQL lifecycle verification.

No owner action is required for the current local or CI work.

## Verification

Current branch evidence:

```text
npm run format:check          PASS
npm run docs:check            PASS
npm run config:check          PASS
npm run db:check              PASS
npm run db:verify             PASS
npm run db:verify:auth        PASS
npm run db:verify:registration PASS
npm run db:verify:recovery    PASS
```

The latest PostgreSQL CI job passed migration application, immutable audit checks, Better Auth persistence, registration atomicity and the full verification/reset lifecycle. Application type/build verification must pass again after the final TypeScript fixes and read-only CI restoration.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Google OAuth, A03 callback handling, Turnstile and route-level rate limiting remain intentionally deferred within #4.
- Buyer/supplier workspace creation and commercial activation remain separate domain work in #5–#8.
- Cloudflare Images account configuration remains an external dashboard task.
- The static prototype remains a reference and does not replace production accessibility or responsive validation.

These are later integration or deployment blockers, not blockers for local verification, token lifecycle tests or A01–A07 UI development.

## Next tasks

1. Merge PR #19 only after clean read-only application and PostgreSQL CI jobs pass.
2. Add the email outbox dispatcher only when Cloudflare Email Sending authorization is available; never log token-bearing action URLs.
3. Continue #4 with Google OAuth account-linking, A03 callback states, Turnstile and route-level rate limiting.
4. Provision Neon and deployed Hyperdrive before claiming remote Worker database readiness.
5. Continue Phase 1 in dependency order through #5–#9 and close it through integration gate #10.
