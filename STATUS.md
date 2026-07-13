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
- Kept fake Cloudflare resource IDs, public object URLs and credentials out of source control.

## In progress

Draft PR #31 on `agent/supplier-company-foundation` adds the first Supplier company/profile domain slice:

- relational Supplier company, membership, type, application-context, production-capability and export-market records;
- `supplier_draft` as the only creation outcome in this slice;
- Supplier/Both intent plus verified business-identity eligibility;
- one identity-bound Supplier company per verified business-identity review;
- legal-name drift denial unless matching verified identity evidence exists;
- owner/admin/editor/viewer membership authorization and cross-company isolation;
- seeded-key enforcement for Supplier type and production capability selections;
- deterministic minimum-profile completeness;
- reconstructable immutable create/update audits with old/new values;
- literal taxonomy namespace checks in PostgreSQL;
- unit and PostgreSQL integration coverage.

Retrospective audit findings and remediation evidence are tracked in issue #32. Supplier onboarding screens, company-document storage/review and Supplier activation are not present on `main` and must not be reported as merged.

## Verification

GitHub Actions run `29237714237` passed both permanent read-only jobs on PR #31 head `5e62a7873f10f13c551fadd14e9286651b328de1`:

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
npm run db:verify:supplier-company                PASS
```

The Supplier gate proves identity-bound creation, malformed namespace rejection, legal-name drift denial, membership isolation, viewer denial, seeded-selection enforcement, deterministic completeness, draft-state preservation and reconstructable immutable audit evidence.

## Known issues and blockers

- The authoritative launch Supplier type and production-capability seed inventory is not yet committed. PR #31 uses isolated fixtures and must remain draft until production seed coverage is added or explicitly split into a blocking prerequisite.
- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live callback completion remains unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Initial Super Admin bootstrap remains a controlled provisioning action rather than a public or self-service workflow.
- Evidence content inspection/scanning, quarantine and retention cleanup policy remain open.
- Supplier onboarding screens, company-document review and activation remain future work in #6–#8.
- Cloudflare Images account configuration remains an external dashboard task.

These are remote-integration, seed or later-feature blockers. They do not invalidate the current local authorization, migration, CI or PostgreSQL evidence, but they prevent claiming user-facing Supplier onboarding or production readiness.

## Next tasks

1. Commit and verify the authoritative Turkish/English launch Supplier type and production-capability seed inventory.
2. Re-run permanent read-only CI on the final PR #31 head and keep the PR draft until the seed blocker is resolved.
3. Continue issue #6 with S01–S04 only after the foundation and seed contract are merged.
4. Continue company-document and activation work separately through #7–#8.
5. Keep remote Neon/Hyperdrive/R2, email delivery, Google OAuth and abuse-control evidence explicitly unverified until real resources exist.
