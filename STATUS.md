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
- Merged route registration, A10 evidence entry and permanent evidence CI repair through PR #26.
- Merged fixed Reviewer/Admin business-identity authorization, self-review denial and private staff evidence access through PR #27.
- Merged audited platform staff assignment management through PR #30.
- Merged the audited Supplier company/profile foundation through PR #31.
- Merged the Supplier launch catalogue, idempotent production seeds and exact PostgreSQL seed verification through PR #33 as `6ca28b706b4eabe1b03d90835366a46f863c6e04`.
- Kept fake Cloudflare resource IDs, public object URLs and credentials out of source control.

## In progress

Draft PR #36 on `agent/supplier-onboarding-screens` implements the specification-defined Supplier onboarding screens S01–S04 using the merged Supplier domain and launch catalogue:

- `/supplier` overview with activation boundary, deterministic onboarding progress and intentionally disabled product/RFQ/enquiry/document placeholders;
- `/supplier/onboarding` stepper, checklist cards, blocking issues and the first available continuation action;
- `/supplier/company` creation and update for the verified-identity-bound Supplier company, including company details and export-market code capture;
- `/supplier/capabilities` for seeded Supplier types, fixed application contexts and reviewed production capabilities;
- server-side owner/admin/editor edit permissions and viewer read-only behaviour;
- complete Turkish/English shell, page, form, checklist, catalogue-order and error copy selected from the persisted account language preference;
- loading, empty, blocked, error, validation, success and read-only states;
- explicit preservation of Supplier draft/activation state: profile completion never grants commercial access;
- route-registration regression coverage, deterministic onboarding/form-normalization tests and bilingual-copy contract tests.

Company-document upload/review and Supplier activation remain separate work in issues #7 and #8. Product creation, RFQ response and team invitations are not part of PR #36.

## Verification

Read-only GitHub Actions run `29244872091` passed before the final full-page localization changes:

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

The Supplier onboarding unit evidence covers dependency blocking, incomplete document activation, localized checklist copy, repeated checkbox normalization, optional-field normalization, founded-year parsing and export-market normalization. The bilingual-copy tests require non-empty Turkish and English screen contracts and preserve activation/document boundaries in both languages. The existing PostgreSQL Supplier gate continues to prove verified-identity binding, membership isolation, viewer denial, seeded-catalogue enforcement, deterministic completeness and immutable profile-update audits.

The final localized and formatted head requires one permanent read-only CI run before review or merge.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live callback completion remains unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Initial Super Admin bootstrap remains a controlled provisioning action rather than a public or self-service workflow.
- Evidence content inspection/scanning, quarantine and retention cleanup policy remain open.
- Company-document private upload/review and Supplier activation are not implemented yet; S01–S04 do not make the marketplace production-ready.
- Country codes currently enforce a shared uppercase two-letter format, not authoritative ISO membership; issue #34 tracks the explicit semantic decision.
- Routes still rely on the current single-company assumption; issue #35 tracks explicit Supplier company/workspace selection before multi-company membership is exposed.
- Cloudflare Images account configuration remains an external dashboard task for company and product media.

These are remote-integration or later-feature blockers. They do not invalidate the current local authorization, route, migration, seed, CI or PostgreSQL evidence, but they prevent claiming remote production readiness or commercial Supplier activation.

## Next tasks

1. Obtain a final green read-only CI run on the fully localized PR #36 head and squash merge it.
2. Continue issue #7 with private company-document upload, requirement resolution, authorized retrieval and reviewer decisions.
3. Continue issue #8 with the central Supplier activation evaluator and audited state transitions.
4. Resolve country-code semantics in #34 and explicit multi-company selection in #35 before exposing those assumptions more broadly.
5. Keep remote Neon/Hyperdrive/R2, email delivery, Google OAuth and abuse-control evidence explicitly unverified until real resources exist.
