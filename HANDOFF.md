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

`main` currently ends at `b85bcdd87c71c6c744ff11bc46d7405cefecb504`, the squash merge of PR #30. Phase 0, runtime configuration, local PostgreSQL verification, Better Auth persistence, transactional registration, verification/password recovery, guarded Google OAuth, auth abuse controls, explicit Google link/unlink safeguards, the business-identity/Buyer state machine, A08–A10 onboarding, private manual-exception evidence, Reviewer/Admin business-identity authorization and audited platform staff assignment management are merged.

Draft PR #31 on `agent/supplier-company-foundation` contains the only Supplier company foundation implementation currently present in GitHub. It adds:

- identity-bound Supplier company records linked to a verified `business_identity_reviews` row;
- legal-name drift denial unless verified identity evidence matches;
- `supplier_draft` creation without Supplier activation;
- owner/admin/editor/viewer memberships and cross-company isolation;
- Supplier type, application-context, production-capability and export-market relations;
- active seeded-key enforcement for Supplier types and production capabilities;
- deterministic profile completeness;
- reconstructable immutable create/update audits with normalized old/new values;
- PostgreSQL checks that require literal taxonomy namespace separators;
- a permanent `db:verify:supplier-company` CI gate.

Retrospective findings and disposition are tracked in issue #32. Earlier descriptions of merged Supplier onboarding, documents, review or activation work are not supported by the repository commit graph and must not be repeated.

## Exact next tasks

1. Add the authoritative launch Supplier type and production-capability seed inventory with stable keys and Turkish/English labels.
2. Verify exact production seed contents independently from fixture-only integration data.
3. Keep PR #31 draft until the seed blocker is resolved and permanent read-only CI passes on its final head.
4. After merge, implement S01–S04 as a separate route/UI slice using the existing domain service.
5. Keep company-document upload/review in #7 and Supplier activation in #8; do not fold them into the foundation PR.
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
npm run db:verify:supplier-company
npm run db:local:down
```

`db:verify:supplier-company` must prove:

- Supplier/Both intent and matching verified identity evidence are required;
- the company persists the bound review ID;
- legal-name drift is rejected;
- malformed `supplier_typeX...` and `production_capabilityX...` keys fail database constraints;
- owner creation, membership isolation and viewer denial work;
- unseeded custom selections are rejected;
- profile completeness is deterministic and never activates Supplier;
- immutable update audits contain complete old/new profile values.

GitHub Actions run `29237714237` passed the application and complete PostgreSQL chain on audited PR #31 head `5e62a7873f10f13c551fadd14e9286651b328de1`. Documentation commits made afterward require one final permanent read-only CI run before the evidence is considered current.

## Known blockers

- Authoritative launch Supplier type and production-capability seed rows are not committed; current integration rows are fixtures only.
- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured; live callback completion remains unverified.
- Real Turnstile and Cloudflare Rate Limiting resources are not provisioned.
- Initial Super Admin bootstrap requires controlled provisioning.
- Evidence malware/content inspection, quarantine and retention cleanup are not implemented.
- Cloudflare Images remains an account-level dependency for later media work.

These blockers do not invalidate local migration, authorization, audit or PostgreSQL verification. They do prevent claiming production seed readiness, user-facing Supplier onboarding, remote auth readiness or production-ready document review operations.
