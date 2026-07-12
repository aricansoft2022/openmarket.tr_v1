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
- Merged route registration, A10 evidence entry and permanent evidence CI repair through PR #26 as `68db58fac2b3a2e4f725ea44a47edad7629d9e64`.
- Merged fixed Reviewer/Admin business-identity authorization, self-review denial and private staff evidence access through PR #27 as `f3854595929089bbcb71289014c9e34aa5b93cf6`.
- Kept fake Cloudflare resource IDs, public object URLs and credentials out of source control.

## In progress

PR #28 on `agent/platform-staff-assignment-management` adds audited platform staff assignment management:

- administrator-only assignment list, grant, revoke and reactivation permissions;
- Platform Admin management of operational roles only;
- Super Admin management of operational and administrator roles;
- exact existing-account lookup by normalized email;
- server-side self-grant and self-revoke denial;
- duplicate-active protection and revoked-row reactivation;
- `/admin/staff` permission-denied, grant, active/revoked and reasoned revoke states;
- immutable grant/revoke audits containing effective role, old/new values and request evidence;
- next-request permission changes;
- unit, route and PostgreSQL integration coverage.

No arbitrary custom roles, permission JSON or delegation model is introduced.

## Verification

GitHub Actions run `29211331029` passed the complete PostgreSQL chain, including `db:verify:platform-staff-management`. The application job reached only the expected formatting failure before the branch preparation pass; final clean application and database CI remain required.

```text
npm run format:check                              pending final CI
npm run docs:check                                pending final CI
npm run config:check                              pending final CI
npm run typecheck                                 pending final CI
npm run test:run                                  pending final CI
npm run build                                     pending final CI
npm run db:check                                  preliminary PASS
npm run db:verify                                 preliminary PASS
npm run db:verify:auth                            preliminary PASS
npm run db:verify:registration                    preliminary PASS
npm run db:verify:recovery                        preliminary PASS
npm run db:verify:google                          preliminary PASS
npm run db:verify:google-linking                  preliminary PASS
npm run db:verify:business-identity               preliminary PASS
npm run db:verify:business-identity-onboarding    preliminary PASS
npm run db:verify:business-identity-evidence      preliminary PASS
npm run db:verify:business-identity-review        preliminary PASS
npm run db:verify:platform-staff-management       preliminary PASS
```

The new staff-management gate proves administrator-only access, hierarchy enforcement, self-management denial, exact-account grant, duplicate protection, revoke/reactivate lifecycle, immediate permission changes and effective-role audit evidence.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live callback completion remains unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Evidence content inspection/scanning, quarantine and retention cleanup policy remain open.
- Supplier workspace and document activation remain separate domain work in #6–#8.
- Cloudflare Images account configuration remains an external dashboard task.

These are remote integration or later feature blockers, not blockers for local permission validation, CI, PostgreSQL verification or production builds.

## Next tasks

1. Merge PR #28 only after both permanent read-only CI jobs pass on the final branch head.
2. Add company-email verification delivery after the email dispatcher is authorized.
3. Define evidence scanning, quarantine and retention cleanup before claiming production-ready review.
4. Provision remote Neon/Hyperdrive/R2 evidence before claiming preview or production readiness.
5. Continue Phase 1 in dependency order through supplier issues #6–#8, complete the remaining fixed permission coverage in #9 and close through integration gate #10.
