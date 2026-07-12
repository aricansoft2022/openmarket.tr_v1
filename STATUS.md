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
- Merged A04–A07 email verification and password recovery, transactional auth email outbox intent and token lifecycle checks through PR #19.
- Merged guarded Google OAuth policy, POST-only initiation and A03 callback states through PR #20.
- Merged route-level rate limiting, Turnstile policy, local-only bypass and remote fail-closed auth controls through PR #21.
- Merged explicit authenticated Google link/unlink safeguards, password re-verification and audit evidence through PR #22.
- Kept fake Cloudflare resource IDs and credentials out of source control.

## In progress

The first issue #5 slice establishes business identity and buyer activation foundations:

- administrator-managed `public_email`, `blocked` and `company_exception` domain policies;
- normalized private company-email records with pending/verified/rejected state;
- deterministic business-identity review methods and statuses;
- separate browser/active/suspended buyer profiles;
- workspace intent expansion that preserves Buyer plus Supplier as Both;
- company-domain auto-verification only for an exactly matching, already verified account email;
- mandatory manual review for public-email domains;
- immediate rejection for blocked domains;
- `ACTIVE_BUYER` gating only after a verified review;
- immutable submission, decision and workspace-intent audit records;
- migration `drizzle/0004_empty_phil_sheldon.sql` and PostgreSQL state-machine verification.

A08–A10 routes, manual-exception document upload and admin review UI are intentionally separate follow-up slices. No owner action is required for this local/CI foundation.

## Verification

Current branch target:

```text
npm run format:check                 PASS
npm run docs:check                   PASS
npm run config:check                 PASS
npm run typecheck                    PASS
npm run test:run                     PASS
npm run build                        PASS
npm run db:check                     PASS
npm run db:verify                    PASS
npm run db:verify:auth               PASS
npm run db:verify:registration       PASS
npm run db:verify:recovery           PASS
npm run db:verify:google             PASS
npm run db:verify:google-linking     PASS
npm run db:verify:business-identity  PASS
```

The business-identity verification covers company-domain auto verification, public-domain manual review, blocked-domain rejection, separate-company-email pending state, workspace expansion, supplier-only non-activation, manual approval, duplicate-decision rejection, active-buyer commercial guard, audit outcomes and database constraints.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live link callbacks remain unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Company-email verification delivery, manual evidence upload and reviewer/admin authorization remain open in issue #5.
- Supplier workspace and document activation remain separate domain work in #6–#8.
- Cloudflare Images account configuration remains an external dashboard task.
- The static prototype remains a reference and does not replace production accessibility or responsive validation.

These are remote integration or later feature blockers, not blockers for local state-machine validation, CI or production builds.

## Next tasks

1. Merge the business-identity foundation only after permanent read-only application and PostgreSQL CI jobs pass.
2. Add A08 workspace selection and A09/A10 applicant status/resubmission routes against the committed transition service.
3. Add manual exception evidence metadata and private R2 upload authorization without mixing supplier activation.
4. Add reviewer/admin decision routes with explicit permission checks, reasons and audit evidence.
5. Provision remote auth/database resources before claiming remote readiness.
6. Continue Phase 1 in dependency order through #6–#9 and close it through integration gate #10.
