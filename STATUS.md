# Project status

**Updated:** 2026-07-13  
**Source of truth:** `spec.md` version 2.1  
**Repository:** `aricansoft2022/openmarket.tr_v1`

## Current phase

Phase 1 — Identity and supplier activation foundation.

## Completed on `main`

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
- Merged audited platform staff assignment management through PR #30 as `b85bcdd87c71c6c744ff11bc46d7405cefecb504`.
- Merged the audited Supplier company/profile foundation through PR #31 as `2a44a6b81ed3079071987a58620133632347e7f9`.
- Kept fake Cloudflare resource IDs, public object URLs and credentials out of source control.

## In progress

Draft PR #33 on `agent/supplier-launch-seeds` adds the launch Supplier catalogue and closes the production-seed gap found by retrospective audit #32:

- the six Supplier types defined verbatim by specification section 5.3, with stable keys and Turkish/English labels;
- a deliberately narrow textile production-capability set derived only from explicitly named launch processes and services;
- a code-owned idempotent seed operation that repairs canonical rows and deactivates non-launch values without deleting history;
- an exact PostgreSQL production-inventory gate separate from fixture data;
- Supplier company integration tests that consume the real launch catalogue;
- profile completeness aligned with the specification: Supplier type and application context are required, while production capabilities remain optional for exporters and distributors.

The production-capability list is a reviewed catalogue decision, not a claim that the specification supplied a standalone verbatim enumeration. Expanding it requires another reviewed seed change.

Supplier onboarding screens, company-document storage/review and Supplier activation are not yet present on `main`.

## Verification

Permanent read-only GitHub Actions run `29243586323` passed on PR #33 head `9a41586d0c39016300bff599bfc6d15500e1083a`:

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
npm run db:verify:platform-staff-management       PASS
npm run db:seed:supplier-catalogue                PASS
npm run db:verify:supplier-catalogue              PASS
npm run db:verify:supplier-company                PASS
```

The seed gate proves the exact active catalogue, bilingual labels, deterministic ordering, repeated idempotency, canonical-row repair and non-launch archival. The Supplier gate proves that the production catalogue is consumed without forcing non-manufacturing Supplier types to claim production capabilities.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live callback completion remains unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Initial Super Admin bootstrap remains a controlled provisioning action rather than a public or self-service workflow.
- Evidence content inspection/scanning, quarantine and retention cleanup policy remain open.
- Supplier onboarding screens, company-document review and activation remain future work in #6–#8.
- Cloudflare Images account configuration remains an external dashboard task.

These are remote-integration or later-feature blockers. They do not invalidate the current local authorization, migration, seed, CI or PostgreSQL evidence, but they prevent claiming user-facing Supplier onboarding or production readiness.

## Next tasks

1. Squash merge PR #33 after its final documentation commit passes permanent read-only CI.
2. Close or split the resolved seed finding in audit issue #32; keep explicit follow-ups for country-code semantics and future multi-company selection.
3. Continue issue #6 with S01–S04 as a separate Supplier onboarding route/UI slice using the merged domain and catalogue services.
4. Continue company-document and activation work separately through #7–#8.
5. Keep remote Neon/Hyperdrive/R2, email delivery, Google OAuth and abuse-control evidence explicitly unverified until real resources exist.
