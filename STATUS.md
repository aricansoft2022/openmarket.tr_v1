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
- Kept fake Cloudflare resource IDs and credentials out of source control.

## In progress

- #15 — Add transactional `user_preferences` persistence for country, preferred language and Buyer/Supplier/Both intent.
- Add A01 `/giris`, A02 `/kayit` and A03 registration-success states with server validation and accessible responsive forms.
- Prove that a preference constraint failure rolls back the Better Auth user and credential-account writes.
- Keep #2 and #3 open for the remaining real Neon and deployed Hyperdrive verification.

No owner action is required for the current local or CI work.

## Verification

Current merged repository verification:

```text
npm run verify            PASS
npm run config:check      PASS
npm run db:check          PASS
npm run db:verify         PASS
npm run db:verify:auth    PASS
GET /                     200, SSR markers present
GET /health               200, valid no-cache JSON payload
GitHub Actions             PASS: application + database jobs
```

The current registration slice adds migration `0002_strange_sugar_man.sql`, unit form-validation tests and `npm run db:verify:registration` for atomic user/preference persistence.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- Email verification delivery, resend, forgot/reset password, Google OAuth and Turnstile remain intentionally deferred within #4.
- Buyer/supplier workspace creation and commercial activation remain separate domain work in #5–#8.
- Email Sending authorization and Cloudflare Images account configuration remain external dashboard tasks.
- The static prototype remains a reference and does not replace production accessibility or responsive validation.

These are later integration or deployment blockers, not blockers for transactional local registration and A01/A02 UI verification.

## Next tasks

1. Merge #15 only after application and PostgreSQL CI jobs pass.
2. Continue #4 with account email verification/resend and forgot/reset token states.
3. Add Google OAuth account-linking and Turnstile/rate limiting only after real credentials and abuse-control contracts exist.
4. Provision Neon and deployed Hyperdrive before claiming remote Worker database readiness.
5. Continue Phase 1 in dependency order through #5–#9 and close it through integration gate #10.
