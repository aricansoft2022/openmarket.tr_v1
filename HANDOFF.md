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

Phase 0, runtime configuration, local PostgreSQL verification, Better Auth persistence, transactional registration, A04–A07 verification/password recovery, guarded Google OAuth/A03 states, route-level auth abuse controls, explicit Google link/unlink safeguards, the business-identity/Buyer state machine, A08–A10 onboarding, private owner-only manual-exception evidence storage and fixed Reviewer/Admin business-identity authorization are merged to `main` through PR #27.

The current PR #28 branch adds audited platform staff assignment management:

- code-owned staff assignment list/grant/revoke permissions;
- active Platform Admin and Super Admin manager resolution on every request;
- Platform Admin management of operational roles only;
- Super Admin management of administrator and operational roles;
- existing-account lookup by normalized exact email;
- server-side self-grant and self-revoke denial;
- one unique user/role row with revoked-row reactivation;
- `/admin/staff` with X04 denial, grant, active/revoked and reasoned revoke states;
- immutable grant/revoke audit evidence with effective role and old/new values;
- PostgreSQL verification of hierarchy, immediate permission changes and audit behavior.

Reviewer, Moderator, Buyer and Supplier states never imply staff-management authority. No custom role editor, arbitrary permission JSON or delegation model is included.

## Exact next tasks

1. Merge PR #28 only after permanent application and PostgreSQL CI jobs pass on the final branch head.
2. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
3. Keep issue #4 open for external delivery and remote auth evidence.
4. Continue issue #5 in separate reviewed slices:
   - company-email verification delivery and token lifecycle;
   - evidence scanning/quarantine and retention cleanup;
   - deployed R2 plus Neon/Hyperdrive preview evidence.
5. Do not infer business identity from account verification alone.
6. Public email domains never grant automatic business identity.
7. Do not add supplier activation or supplier documents to issue #5.
8. Continue supplier work in dependency order through #6–#8, then finish remaining fixed permissions in #9 and the integration gate in #10.

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
npm run db:local:down
```

`db:verify:platform-staff-management` must prove administrator-only access, Platform Admin/Super Admin hierarchy, self-management denial, exact-account grant, duplicate-active rejection, revoke/reactivate reuse, next-request permission changes and immutable effective-role audit evidence.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured; live callback completion remains unverified.
- Real Turnstile and Cloudflare Rate Limiting resources are not provisioned.
- Evidence malware/content inspection, quarantine and retention cleanup are not implemented.
- Cloudflare Images remains an account-level dependency for later media work.

These blockers do not prevent local onboarding, permission enforcement, staff assignment management, CI, local PostgreSQL tests or production builds. They do prevent claiming remote auth, live company-email verification or production-ready document review operations.
