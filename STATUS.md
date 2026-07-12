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
- Merged business-identity domain policy, company-email, review and Buyer activation state machine through PR #23.
- Kept fake Cloudflare resource IDs and credentials out of source control.

## In progress

The current issue #5 route slice adds A08–A10:

- authenticated `/onboarding/workspaces` Buyer/Supplier/Both selection;
- workspace widening through the committed state machine without silent narrowing;
- authenticated `/onboarding/business-identity` submission;
- verified-account enforcement before business identity;
- pending/verified submissions redirected away from duplicate forms;
- rejected submissions prefilled for resubmission;
- public-domain/manual-review, separate-email pending and blocked-domain explanations;
- disabled manual-document upload until private R2 authorization exists;
- `/onboarding/business-identity/status` pending/verified/rejected timeline;
- rejection reason and resubmission path;
- Buyer active/browser status separated from Supplier activation;
- transaction-level duplicate-pending protection using a locked user row;
- PostgreSQL verification with a real Better Auth session cookie.

No owner action is required for this local/CI route slice.

## Verification

Current branch target:

```text
npm run format:check                            PASS
npm run docs:check                              PASS
npm run config:check                            PASS
npm run typecheck                               PASS
npm run test:run                                PASS
npm run build                                   PASS
npm run db:check                                PASS
npm run db:verify                               PASS
npm run db:verify:auth                          PASS
npm run db:verify:registration                  PASS
npm run db:verify:recovery                      PASS
npm run db:verify:google                        PASS
npm run db:verify:google-linking                PASS
npm run db:verify:business-identity             PASS
npm run db:verify:business-identity-onboarding  PASS
```

The A08–A10 database gate verifies authenticated state loading, Buyer-to-Both workspace widening, public-domain pending review, duplicate-pending rejection, status loading, manual approval, active Buyer state, duplicate-verified rejection and immutable audit evidence.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live link callbacks remain unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Company-email verification delivery, private manual-exception evidence upload and reviewer/admin authorization remain open in issue #5.
- Supplier workspace and document activation remain separate domain work in #6–#8.
- Cloudflare Images account configuration remains an external dashboard task.
- The static prototype remains a reference and does not replace production accessibility or responsive validation.

These are remote integration or later feature blockers, not blockers for local onboarding validation, CI or production builds.

## Next tasks

1. Merge the A08–A10 route slice only after permanent read-only application and PostgreSQL CI jobs pass.
2. Add private manual-exception evidence metadata and R2 authorization without mixing supplier activation.
3. Add reviewer/admin decision routes with explicit permission checks, reasons and audit evidence.
4. Add company-email verification delivery after the email dispatcher is authorized.
5. Provision remote auth/database resources before claiming remote readiness.
6. Continue Phase 1 in dependency order through #6–#9 and close it through integration gate #10.
