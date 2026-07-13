# Project status

**Updated:** 2026-07-13  
**Source of truth:** `spec.md` version 2.1  
**Repository:** `aricansoft2022/openmarket.tr_v1`

## Current phase

Phase 1 — Identity and supplier activation foundation.

## Completed on `main`

- Merged the Phase 0 scaffold, documentation contract and read-only CI through PR #1.
- Merged runtime configuration and local Cloudflare binding emulation through PR #12.
- Merged PostgreSQL migration and audit-invariant verification through PR #13.
- Merged Better Auth persistence, registration, verification, recovery, guarded Google OAuth, abuse controls and explicit provider link/unlink safeguards through PRs #14, #17 and #19–#22.
- Merged the business-identity domain, Buyer activation state machine, A08–A10 onboarding, private exception evidence, reviewer authorization and audited platform staff management through PRs #23–#27 and #30.
- Merged the audited Supplier company/profile foundation and launch catalogue through PRs #31 and #33.
- Merged Supplier onboarding screens S01–S04, bilingual copy and server-side membership permissions through PR #36.
- Merged the private Supplier company-document implementation through PR #37: catalogue and deterministic requirement resolution, S05–S07, D17–D18, private R2 keying, upload metadata validation, scan gates, review/replacement states, short-lived access grants, immutable review history and effective-role audit evidence.
- Kept fake Cloudflare resource IDs, public private-document URLs and credentials out of source control.

## In progress

Draft PR #38 on `agent/supplier-documents-post-merge-hardening` converts the PR #37 preparation mechanism into normal committed source and restores a trustworthy green baseline:

- materializes the reviewed Supplier-document source and generated migration;
- removes temporary patch scripts, marker files and branch-specific write/finalizer workflows;
- preserves the database trigger preventing UPDATE or DELETE of review-history rows;
- maps unauthorized private-document lookup to a non-disclosing not-found result;
- installs a permanent read-only Supplier-document workflow;
- verifies format, types, unit tests, production build, migration metadata, catalogue seeds and the private PostgreSQL/R2 lifecycle from the committed source.

Supplier activation is deliberately unchanged. Commercial Supplier access remains blocked until issue #8 implements the central evaluator and audited state transitions.

## Verification

Permanent read-only GitHub Actions on clean PR #38 head `d4b602c45cdd920d89d65ebe89f50ef974999e5d` passed:

```text
Supplier document lifecycle run 29255026975
  npm run format:check                              PASS
  npm run typecheck                                 PASS
  npm run test:run                                  PASS
  npm run build                                     PASS
  npm run db:check                                  PASS
  npm run db:migrate                                PASS
  npm run db:seed:supplier-catalogue                PASS
  npm run db:verify:supplier-catalogue              PASS
  npm run db:seed:supplier-documents                PASS
  npm run db:verify:supplier-documents              PASS
  npm run db:verify:supplier-document-lifecycle     PASS

Main CI run 29255027068
  npm run format:check                              PASS
  npm run docs:check                                PASS
  npm run config:check                              PASS
  npm run typecheck                                 PASS
  npm run test:run                                  PASS
  npm run build                                     PASS
  complete existing PostgreSQL verification chain  PASS
```

The Supplier-document lifecycle evidence covers private server-generated object keys, file metadata constraints, stored-object SHA-256, scan transitions, submission and review transitions, reviewer-company conflict denial, cross-company non-disclosure, short-lived single-use access grants, replacement versioning, mandatory-requirement continuity and immutable review events.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live callback completion remains unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Initial Super Admin bootstrap remains a controlled provisioning action rather than a public or self-service workflow.
- The application exposes scan-result hooks and quarantine-safe state transitions, but a real malware/content scanner and retention cleanup worker are not connected.
- Supplier activation state transitions are not implemented; approved documents alone do not grant marketplace capabilities.
- Country codes currently enforce a shared uppercase two-letter format, not authoritative ISO membership; issue #34 tracks the explicit semantic decision.
- Routes still rely on the current single-company assumption; issue #35 tracks explicit Supplier company/workspace selection before multi-company membership is exposed.
- Cloudflare Images account configuration remains an external dashboard task for company and product media.

These are remote-integration or later-feature blockers. They do not invalidate the current local authorization, route, migration, seed, CI or PostgreSQL evidence, but they prevent claiming remote production readiness or commercially active Supplier operations.

## Next tasks

1. Merge PR #38 after the documentation-only head passes read-only CI and close issue #7.
2. Implement issue #8 with one central Supplier activation evaluator over verified identity, minimum profile, Supplier types and approved mandatory documents.
3. Add audited transitions for pending, active, reactivation-required and suspended Supplier states without allowing UI routes to duplicate activation rules.
4. Continue issue #9 permission-matrix and route-guard completion after the activation capabilities exist.
5. Resolve country-code semantics in #34 and explicit multi-company selection in #35 before exposing those assumptions more broadly.
6. Keep remote Neon/Hyperdrive/R2, email delivery, Google OAuth and abuse-control evidence explicitly unverified until real resources exist.
