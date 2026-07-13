# Handoff

## Start here

Read, in order:

1. Run `npm run spec:materialize` and read `spec.full.md`
2. `STATUS.md`
3. `DECISIONS.md`
4. `ARCHITECTURE.md`
5. `DATA_MODEL.md`
6. `RUNTIME_CONFIGURATION.md`
7. `WORKFLOW.md`

Then inspect the current branch and run:

```bash
node --version
npm ci
npm run spec:materialize
npm run verify
npm run db:check
```

Node must satisfy the repository engine requirement. Do not replace `npm ci` with `npm install` in CI or documented verification flows unless the lockfile is intentionally regenerated in a dedicated dependency PR.

## Current state

`main` currently ends at `6ca28b706b4eabe1b03d90835366a46f863c6e04`, the squash merge of PR #33. Phase 0, runtime configuration, local PostgreSQL verification, Better Auth persistence, transactional registration, verification/password recovery, guarded Google OAuth, auth abuse controls, explicit Google link/unlink safeguards, the business-identity/Buyer state machine, A08–A10 onboarding, private manual-exception evidence, Reviewer/Admin business-identity authorization, audited platform staff assignment management, the audited Supplier company/profile foundation and the launch Supplier catalogue/seeds are merged.

Draft PR #36 on `agent/supplier-onboarding-screens` adds the user-facing Supplier onboarding slice S01–S04:

- S01 `/supplier`: Supplier overview, activation boundary, deterministic progress and disabled future-module summaries;
- S02 `/supplier/onboarding`: stepper, checklist, blocking issues and continuation actions;
- S03 `/supplier/company`: verified-identity-bound company create/update and export-market code capture;
- S04 `/supplier/capabilities`: seeded Supplier types, fixed application contexts and reviewed production capabilities;
- owner/admin/editor mutation permission, viewer read-only behaviour and cross-membership isolation through the existing Supplier service;
- Turkish/English Supplier shell, checklist and form-error copy based on account preference;
- route, loading, empty, blocked, error, validation, success and read-only states;
- unit coverage for checklist dependencies, localization and form normalization;
- route-registration coverage and continued PostgreSQL Supplier-foundation verification.

The PR deliberately does not activate Supplier. Company-document upload/review remains #7; the activation evaluator and audited state transitions remain #8. Product creation, RFQ response and invitation UI are later slices.

## Exact next tasks

1. Obtain a final green read-only CI run for PR #36 after the documentation-only commits, then move the draft to review.
2. Implement issue #7 as a separate private company-document lifecycle: requirement resolution, upload metadata, authorized retrieval, review decisions, replacement and expiry handling.
3. Implement issue #8 as a central activation evaluator over verified identity, complete profile, Supplier types and approved mandatory documents.
4. Resolve issue #34 by choosing either an authoritative committed country catalogue or explicitly retaining format-only two-letter semantics across validation, database constraints and UI copy.
5. Resolve issue #35 before exposing multi-company membership: require an explicit validated Supplier company/workspace selection instead of silently taking the earliest active membership.
6. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
7. Keep issue #4 open for external email delivery and remote auth evidence.
8. Do not infer business identity from account verification alone; public email domains never grant automatic business identity.

## Verification commands

Foundation and application checks:

```bash
npm run format:check
npm run docs:check
npm run config:check
npm run typecheck
npm run test:run
npm run build
```

Optional local PostgreSQL and identity/authorization verification:

```bash
cp .env.example .env
npm run db:local:up
npm run db:check
npm run db:verify
npm run db:verify:auth
npm run db:verify:registration
npm run db:verify:recovery
npm run db:verify:google
npm run db:verify:google-linking
npm run db:verify:business-identity
npm run db:verify:business-identity-onboarding
npm run db:verify:business-identity-evidence
npm run db:verify:business-identity-review
npm run db:verify:platform-staff-management
npm run db:seed:supplier-catalogue
npm run db:verify:supplier-catalogue
npm run db:verify:supplier-company
npm run db:local:down
```

`db:verify:supplier-catalogue` must prove:

- the exact active launch inventories and deterministic ordering;
- Turkish and English labels for every value;
- repeated idempotent seeding;
- repair of changed canonical labels, ordering and active flags;
- deactivation rather than deletion of non-launch values.

`db:verify:supplier-company` must prove:

- Supplier/Both intent and matching verified identity evidence are required;
- the company persists the bound review ID;
- legal-name drift is rejected;
- malformed `supplier_typeX...` and `production_capabilityX...` keys fail database constraints;
- owner creation, membership isolation and viewer denial work;
- unseeded custom selections are rejected;
- profile completeness is deterministic and never activates Supplier;
- production capabilities are optional for non-manufacturing Supplier types;
- immutable update audits contain complete old/new profile values.

Supplier onboarding unit and route evidence must prove:

- identity verification blocks company creation until complete;
- capabilities remain blocked until a company exists;
- company documents remain an explicit incomplete activation dependency;
- account language selects the Supplier shell, checklist and public form-error copy;
- repeated checkbox values, optional fields, founded year and export-market values normalize deterministically;
- S01–S04 routes remain registered exactly once and the Supplier stylesheet is loaded exactly once;
- company and capability mutations preserve fields owned by the other screen and never activate Supplier;
- viewer memberships render read-only and server-side mutations remain denied.

GitHub Actions run `29244872091` passed formatting, documentation, runtime configuration, typecheck, unit tests, production build and the complete PostgreSQL chain on PR #36 application head `da82d2f3893974612b7f4a8a3988181c007475ec`. A final documentation-head run is required before review.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured; live callback completion remains unverified.
- Real Turnstile and Cloudflare Rate Limiting resources are not provisioned.
- Initial Super Admin bootstrap requires controlled provisioning.
- Evidence malware/content inspection, quarantine and retention cleanup are not implemented.
- Company-document review and Supplier activation are not implemented.
- Country-code membership semantics and explicit multi-company selection remain open in #34 and #35.
- Cloudflare Images remains an account-level dependency for later company/product media work.

These blockers do not invalidate local route, migration, authorization, audit, seed or PostgreSQL verification. They do prevent claiming remote production readiness, live external-provider readiness or commercially active Supplier operations.
