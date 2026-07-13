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

`main` currently ends at `2a44a6b81ed3079071987a58620133632347e7f9`, the squash merge of PR #31. Phase 0, runtime configuration, local PostgreSQL verification, Better Auth persistence, transactional registration, verification/password recovery, guarded Google OAuth, auth abuse controls, explicit Google link/unlink safeguards, the business-identity/Buyer state machine, A08–A10 onboarding, private manual-exception evidence, Reviewer/Admin business-identity authorization, audited platform staff assignment management and the audited Supplier company/profile foundation are merged.

Draft PR #33 on `agent/supplier-launch-seeds` adds:

- the specification-defined six Supplier types with stable keys and Turkish/English labels;
- a narrow reviewed production-capability catalogue based only on explicitly named textile launch processes and services;
- idempotent seeding that restores canonical labels, ordering and active state;
- archival by deactivation for non-launch values instead of destructive deletion;
- exact production inventory verification independent of fixtures;
- Supplier foundation verification against the real launch catalogue;
- specification-aligned completeness that does not force exporters or distributors to claim production capabilities.

The specification provides a verbatim Supplier type list but not a standalone production-capability enumeration. Do not silently broaden the capability catalogue. New values require a reviewed decision, bilingual labels, stable keys and updated exact-inventory tests.

Supplier onboarding screens, documents, review and activation are not merged. Retrospective findings and disposition remain tracked in issue #32.

## Exact next tasks

1. Run Prettier and restore a completely green permanent read-only CI result on PR #33.
2. Squash merge PR #33 only after both application and PostgreSQL jobs pass on the final head.
3. Update issue #32: close the production-seed finding, and split country-code semantics plus future multi-company selection into explicit follow-ups if they are not fixed in the same slice.
4. Continue issue #6 with S01–S04 as a separate route/UI PR using the merged Supplier domain and catalogue.
5. Keep company-document upload/review in #7 and Supplier activation in #8; do not fold them into onboarding UI.
6. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
7. Keep issue #4 open for external delivery and remote auth evidence.
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

GitHub Actions run `29243192413` passed the complete PostgreSQL chain including the seed and Supplier gates. Its application job stopped at formatting, so it is not final merge evidence.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured; live callback completion remains unverified.
- Real Turnstile and Cloudflare Rate Limiting resources are not provisioned.
- Initial Super Admin bootstrap requires controlled provisioning.
- Evidence malware/content inspection, quarantine and retention cleanup are not implemented.
- Cloudflare Images remains an account-level dependency for later media work.

These blockers do not invalidate local migration, authorization, audit, seed or PostgreSQL verification. They do prevent claiming user-facing Supplier onboarding, remote auth readiness or production-ready document review operations.
