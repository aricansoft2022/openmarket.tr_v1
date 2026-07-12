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

Phase 0, runtime configuration, local PostgreSQL verification, Better Auth persistence, transactional registration, A04–A07 verification/password recovery, guarded Google OAuth/A03 states, route-level auth abuse controls and explicit Google link/unlink safeguards are merged to `main`. The repository can be installed, built and tested without Neon, Google or a Cloudflare account.

The current issue #5 foundation branch adds:

- `email_domain_policies` for public-email, blocked and approved company-domain exceptions;
- private `company_emails` with deterministic pending/verified/rejected state;
- `business_identity_reviews` with company-email, manual-exception and admin-override methods;
- separate `buyer_profiles` with browser/active/suspended state;
- workspace-intent expansion that never silently removes an existing Buyer or Supplier selection;
- automatic business-identity verification only for an exactly matching, already verified company-domain account email;
- mandatory manual review for public-email domains and separate company emails;
- blocked-domain rejection;
- active-buyer gating only after a verified review;
- immutable audit records for submissions, decisions and workspace expansion;
- migration `0004_empty_phil_sheldon.sql` and PostgreSQL state-machine verification.

This branch deliberately does not add A08–A10 routes, manual evidence upload or admin/reviewer UI. Those depend on the committed state machine and remain separate reviewable slices.

## Exact next tasks

1. Merge the business-identity foundation only after both permanent read-only CI jobs pass.
2. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
3. Keep issue #4 open for external delivery and remote auth evidence.
4. Continue issue #5 in separate slices:
   - A08 workspace selection using `selectWorkspaceIntent`;
   - A09 company-email/manual-exception submission using `submitBusinessIdentity`;
   - A10 review status, rejection reason and resubmission;
   - private manual-evidence upload metadata and R2 authorization;
   - reviewer/admin decision routes using `decideBusinessIdentityReview` with explicit role checks;
   - commercial buyer guards using `assertActiveBuyer`.
5. Do not infer business identity from account verification alone.
6. Public email domains never grant automatic business identity.
7. Do not add supplier activation or supplier documents to this issue #5 slice.
8. Continue in dependency order through #6–#10.

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

Optional local PostgreSQL and identity verification:

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
npm run db:local:down
```

`db:verify:business-identity` proves company-domain automatic verification, public-domain manual review, blocked-domain rejection, pending separate-company-email state, workspace expansion, supplier-only non-activation, manual approval, duplicate-decision rejection, active-buyer gating, audit outcomes and database constraints.

The state-machine test uses database fixtures and runs inside a rolled-back transaction. It does not claim that company-email delivery, manual documents, reviewer authorization or remote infrastructure is implemented.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured; live callback completion remains unverified.
- Real Turnstile and Cloudflare Rate Limiting resources are not provisioned.
- Company-email verification delivery and private manual-exception evidence upload remain open.
- Cloudflare Images remains an account-level dependency for later media work.

These blockers do not prevent local state-machine work, CI, local PostgreSQL tests or production builds. They do prevent claiming remote auth, live company-email verification or document-backed manual review readiness.
