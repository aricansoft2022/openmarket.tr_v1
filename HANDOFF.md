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

Phase 0, runtime configuration, local PostgreSQL verification, Better Auth persistence, transactional registration, A04–A07 verification/password recovery, guarded Google OAuth/A03 states, route-level auth abuse controls, explicit Google link/unlink safeguards and the business-identity/Buyer state-machine foundation are merged to `main`.

The current issue #5 route branch adds:

- A08 `/onboarding/workspaces` with authenticated Buyer/Supplier/Both selection;
- A09 `/onboarding/business-identity` with company name/email and applicant note;
- A10 `/onboarding/business-identity/status` with pending, verified and rejected states;
- redirect gates for unauthenticated and unverified accounts;
- pending/verified duplicate-form prevention;
- rejected-state prefill and resubmission;
- public-email/manual-review and separate-company-email explanations;
- a disabled document-upload state until private R2 authorization exists;
- transaction-level duplicate-pending protection;
- session-bound PostgreSQL verification using a real Better Auth cookie.

The routes call the committed transition service. They do not duplicate domain policy or activate Buyer directly from form input.

## Exact next tasks

1. Merge the A08–A10 route PR only after both permanent read-only CI jobs pass.
2. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
3. Keep issue #4 open for external delivery and remote auth evidence.
4. Continue issue #5 in separate slices:
   - private manual-exception evidence metadata and R2 upload authorization;
   - company-email verification delivery and token lifecycle;
   - reviewer/admin decision routes using `decideBusinessIdentityReview` with explicit role checks;
   - commercial route guards using `assertActiveBuyer`.
5. Do not infer business identity from account verification alone.
6. Public email domains never grant automatic business identity.
7. Do not add supplier activation or supplier documents to issue #5.
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
npm run db:verify:business-identity-onboarding
npm run db:local:down
```

`db:verify:business-identity` proves domain classification, review decisions and Buyer activation. `db:verify:business-identity-onboarding` proves authenticated A08–A10 state loading, workspace widening, pending review, duplicate-pending guard, manual approval, active Buyer status and audit evidence.

The onboarding test uses a real Better Auth session cookie and fresh PostgreSQL service container. It does not claim private document upload, reviewer permissions, company-email delivery or remote infrastructure readiness.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured; live callback completion remains unverified.
- Real Turnstile and Cloudflare Rate Limiting resources are not provisioned.
- Company-email verification delivery and private manual-exception evidence upload remain open.
- Reviewer/admin permissioned decision UI remains open.
- Cloudflare Images remains an account-level dependency for later media work.

These blockers do not prevent local onboarding work, CI, local PostgreSQL tests or production builds. They do prevent claiming remote auth, live company-email verification or document-backed manual review readiness.
