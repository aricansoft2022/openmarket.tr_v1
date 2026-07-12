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

Phase 0, runtime configuration, local PostgreSQL verification, Better Auth persistence, transactional registration, A04–A07 verification/password recovery, guarded Google OAuth/A03 states, route-level auth abuse controls, explicit Google link/unlink safeguards, the business-identity/Buyer state machine, A08–A10 onboarding and private owner-only manual-exception evidence storage are merged to `main` through PR #25.

The current repair branch addresses two integration gaps left by PR #25:

- the evidence screen and download handler existed as route modules but were absent from the explicit React Router route config;
- `scripts/verify-business-identity-evidence.ts` existed but was absent from `package.json` and permanent PostgreSQL CI.

The branch now registers both routes, links eligible manual-exception applicants from A10, adds a route-registration regression test and executes the private evidence lifecycle gate in CI.

## Exact next tasks

1. Merge the evidence-route/CI repair only after the application and PostgreSQL CI jobs pass.
2. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
3. Keep issue #4 open for external delivery and remote auth evidence.
4. Continue issue #5 in separate reviewed slices:
   - Reviewer/Admin-only pending review queue and detail routes;
   - private reviewer evidence downloads without exposing object keys;
   - reasoned verify/reject decisions through `decideBusinessIdentityReview`;
   - audited Admin-only staff assignment grant/revoke management;
   - company-email verification delivery and token lifecycle;
   - evidence scanning/quarantine and retention cleanup.
5. Do not infer business identity from account verification alone.
6. Public email domains never grant automatic business identity.
7. Buyer/Supplier workspace state must never imply platform staff authority.
8. Do not add supplier activation or supplier documents to issue #5.
9. Continue in dependency order through #6–#10.

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
npm run db:verify:business-identity-evidence
npm run db:local:down
```

`db:verify:business-identity` proves domain classification, review decisions and Buyer activation. `db:verify:business-identity-onboarding` proves authenticated A08–A10 state loading and resubmission behavior. `db:verify:business-identity-evidence` must prove the owner-only private metadata/R2 lifecycle, file limits, failure compensation, audit evidence and non-owner denial.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured; live callback completion remains unverified.
- Real Turnstile and Cloudflare Rate Limiting resources are not provisioned.
- Reviewer/Admin authorization and staff assignment management are not implemented on the verified main branch.
- Evidence malware/content inspection, quarantine and retention cleanup are not implemented.
- Cloudflare Images remains an account-level dependency for later media work.

These blockers do not prevent local onboarding work, CI, local PostgreSQL tests or production builds. They do prevent claiming remote auth, live company-email verification or reviewer-ready document processing.
