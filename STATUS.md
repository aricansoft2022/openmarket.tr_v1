# Project status

**Updated:** 2026-07-13  
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
- Merged Better Auth persistence and the request-scoped `/api/auth/*` handler through PR #14.
- Merged transactional registration preferences and A01/A02 entry forms through PR #17.
- Merged A04–A07 email verification and password recovery through PR #19.
- Merged guarded Google OAuth and A03 result states through PR #20.
- Merged route-level rate limiting and Turnstile policy through PR #21.
- Merged explicit authenticated Google link/unlink safeguards through PR #22.
- Merged the business-identity domain policy, review and Buyer activation state machine through PR #23.
- Merged A08–A10 workspace, submission, status and resubmission routes through PR #24.
- Merged private manual-exception evidence metadata, R2 lifecycle and owner-only handlers through PR #25.
- Kept fake Cloudflare resource IDs, public object URLs and credentials out of source control.

## In progress

The current branch `agent/register-business-identity-evidence-routes` repairs incomplete PR #25 integration:

- registers `/onboarding/business-identity/evidence` in the explicit React Router route config;
- registers `/onboarding/business-identity/evidence/:evidenceId/download`;
- exposes eligible manual-exception evidence management from A10 status;
- adds a route-registration regression test;
- wires `scripts/verify-business-identity-evidence.ts` into `package.json` and permanent PostgreSQL CI;
- updates the public route and verification documentation.

Without this repair, the evidence route modules exist in source control but are unreachable, and their PostgreSQL/fake-R2 lifecycle verification is never executed by CI.

## Verification

GitHub Actions run `29209552848` passed both permanent jobs on the clean branch head:

```text
npm run format:check                              PASS
npm run docs:check                                PASS
npm run config:check                              PASS
npm run typecheck                                 PASS
npm run test:run                                  PASS
npm run build                                     PASS
npm run db:check                                  PASS
npm run db:verify                                 PASS
npm run db:verify:auth                            PASS
npm run db:verify:registration                    PASS
npm run db:verify:recovery                        PASS
npm run db:verify:google                          PASS
npm run db:verify:google-linking                  PASS
npm run db:verify:business-identity               PASS
npm run db:verify:business-identity-onboarding    PASS
npm run db:verify:business-identity-evidence      PASS
```

The evidence gate proves owner-only upload/list/download/remove, private object-key handling, file limits, failure compensation, immutable audit evidence and non-owner download denial.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live callback completion remains unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Reviewer/admin authorization for business-identity evidence and decisions is not implemented on the verified main branch.
- Evidence content inspection/scanning and retention cleanup policy remain open.
- Supplier workspace and document activation remain separate domain work in #6–#8.
- Cloudflare Images account configuration remains an external dashboard task.

These are remote integration or later feature blockers, not blockers for local CI, PostgreSQL verification or production builds.

## Next tasks

1. Review and merge PR #26; both permanent CI jobs pass.
2. Implement reviewer/admin authorization for pending business-identity queues, evidence access and reasoned decisions.
3. Add audited Admin-only staff grant/revoke management without self-service escalation.
4. Add company-email verification delivery after the email dispatcher is authorized.
5. Define evidence scanning, quarantine and retention cleanup before claiming document-review readiness.
6. Provision remote Neon/Hyperdrive/R2 evidence before claiming preview or production readiness.
7. Continue Phase 1 in dependency order through #6–#9 and close it through integration gate #10.
