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

Node must satisfy the repository engine requirement. Keep `npm ci` in CI and documented verification flows unless the lockfile is intentionally regenerated in a dedicated dependency PR.

## Current state

`main` includes the Phase 0 foundation and the Phase 1 identity, Buyer and Supplier work through merged PR #37:

- Better Auth persistence, registration, verification, recovery and guarded Google OAuth;
- abuse controls and explicit Google link/unlink safeguards;
- business identity, Buyer activation, A08–A10 onboarding and private exception evidence;
- fixed platform staff authorization and audited staff assignment management;
- the verified-identity-bound Supplier company/profile and launch catalogue;
- Supplier onboarding screens S01–S04 with bilingual copy and server-side membership permissions;
- private Supplier company documents with deterministic requirements, S05–S07, D17–D18, private object storage, scan gates, review/replacement states, short-lived access grants, immutable review history and effective-role audit evidence.

Draft PR #38 on `agent/supplier-documents-post-merge-hardening` replaces the merged preparation/patch machinery with the verified normal source. Clean head `d4b602c45cdd920d89d65ebe89f50ef974999e5d` passed permanent Supplier-document run `29255026975` and full CI run `29255027068`.

No Supplier activation transition is implemented yet. Approved mandatory documents are evidence for issue #8; they do not independently enable publication, RFQ response, enquiries, contact reveal or other commercial capabilities.

## Exact next tasks

1. Merge PR #38 after its documentation-only head passes CI, then close issue #7.
2. Implement issue #8 as a central activation evaluator over:
   - verified business identity bound to the Supplier company;
   - complete minimum company profile;
   - at least one allowed Supplier type and required application context;
   - every mandatory company-document requirement satisfied by non-expired approved evidence.
3. Persist audited state transitions for `company_documents_required`, `company_documents_pending`, `company_documents_rejected`, `active_supplier`, `reactivation_required` and `suspended_supplier`.
4. Keep transition rules out of route actions; routes must call one domain service and commercial guards must consume its result.
5. Resolve issue #34 by choosing an authoritative country catalogue or explicitly retaining format-only two-letter semantics.
6. Resolve issue #35 before exposing multi-company membership; require explicit validated company/workspace selection.
7. Keep issues #2–#4 open for real Neon/Hyperdrive, email delivery and external-provider evidence.

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
npm run db:seed:supplier-documents
npm run db:verify:supplier-documents
npm run db:verify:supplier-document-lifecycle
npm run db:local:down
```

`db:verify:supplier-document-lifecycle` must prove:

- upload authorization is scoped to active owner/admin/editor memberships;
- server-generated private object keys and stored SHA-256 values are used;
- uploading, stored, scan, submission, review, expiry and replacement transitions obey database invariants;
- outsiders receive a non-disclosing not-found result and cross-company access is denied;
- only active fixed-role reviewers may list, read and decide documents;
- a reviewer cannot decide evidence for a company they belong to;
- short-lived access grants are user-bound, single-use and rejected after expiry or revocation;
- review decisions persist effective-role audit evidence;
- replacement versions preserve prior approved evidence and immutable review history;
- UPDATE and DELETE against review-history rows are rejected by PostgreSQL.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured; live callback completion remains unverified.
- Real Turnstile and Cloudflare Rate Limiting resources are not provisioned.
- Initial Super Admin bootstrap requires controlled provisioning.
- A real malware/content scanner and retention cleanup worker are not connected; only the application hooks and safe state transitions exist.
- Supplier activation and commercial capability grants remain issue #8.
- Country-code membership semantics and explicit multi-company selection remain open in #34 and #35.
- Cloudflare Images remains an account-level dependency for later company/product media work.

These blockers do not invalidate local route, migration, authorization, audit, seed or PostgreSQL verification. They do prevent claiming remote production readiness, live external-provider readiness or commercially active Supplier operations.
