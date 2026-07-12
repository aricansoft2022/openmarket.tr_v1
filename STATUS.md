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
- Kept fake Cloudflare resource IDs, public object URLs and credentials out of source control.

## In progress

PR #27 on `agent/business-identity-review-authorization` adds permissioned business-identity review:

- fixed launch platform roles stored in `platform_staff_assignments` with active/revoked state;
- code-owned list/read/decide/evidence permissions;
- active Compliance Reviewer, Platform Admin and Super Admin authorization;
- anonymous, unrelated-role, revoked-assignment and self-review denial;
- pending review queue, detail and reasoned verify/reject routes;
- private Reviewer/Admin evidence downloads without object-key disclosure;
- effective staff role on privileged immutable audit records;
- next-request revocation behavior;
- unit, route and PostgreSQL/fake-R2 integration coverage.

No staff self-service grant/revoke surface is introduced. Buyer, Supplier and Moderator state remain separate from platform staff authority.

## Verification

GitHub Actions run `29210967065` passed both permanent jobs on the clean branch head:

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
npm run db:verify:business-identity-review        PASS
```

The authorization gate proves fixed-role resolution, Moderator and revoked-assignment denial, self-review denial, safe private evidence access, reasoned decisions, Buyer activation, effective-role audit evidence and revocation on the next request.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live callback completion remains unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Audited Admin-only staff grant/revoke management remains open after the authorization slice.
- Evidence content inspection/scanning, quarantine and retention cleanup policy remain open.
- Supplier workspace and document activation remain separate domain work in #6–#8.
- Cloudflare Images account configuration remains an external dashboard task.

These are remote integration or later feature blockers, not blockers for local permission validation, CI, PostgreSQL verification or production builds.

## Next tasks

1. Merge PR #27; both permanent read-only CI jobs pass on the clean branch head.
2. Add audited Admin-only staff assignment grant/revoke management without self-service escalation.
3. Add company-email verification delivery after the email dispatcher is authorized.
4. Define evidence scanning, quarantine and retention cleanup before claiming production-ready review.
5. Provision remote Neon/Hyperdrive/R2 evidence before claiming preview or production readiness.
6. Continue Phase 1 in dependency order through supplier issues #6–#8, fixed permission issue #9 and integration gate #10.
