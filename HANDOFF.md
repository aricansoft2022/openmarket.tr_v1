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

Phase 0, runtime configuration, local PostgreSQL verification, Better Auth persistence, transactional registration, A04–A07 verification/password recovery, guarded Google OAuth/A03 states and route-level auth abuse controls are merged to `main`. The repository can be installed, built and tested without Neon, Google or a Cloudflare account.

The current explicit-account-linking branch adds:

- authenticated `/account/security` settings;
- provider listing without access/refresh/id-token exposure;
- current-password re-verification before Google link or unlink;
- explicit Better Auth `link-social` initiation using the existing session;
- same-email-only, no-profile-overwrite policy inherited from the auth configuration;
- separate link/unlink rate-limit budgets;
- last-login-method preservation before unlink;
- immutable link/unlink audit records keyed to the internal auth account ID;
- PostgreSQL verification for password/session gates, Google authorization redirect, pre-callback zero write, listing, unlink persistence and audit evidence.

The integration test does not claim a live Google callback. It uses dummy credentials to generate the authorization request, then inserts a provider-linked fixture to verify the post-callback account-management and audit path.

## Exact next tasks

1. Merge the explicit Google account-linking PR only after both permanent read-only CI jobs pass.
2. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
3. Keep issue #4 open for external delivery and remote evidence:
   - Cloudflare email dispatcher after sender authorization exists;
   - live Google linking callback using development credentials and the exact authorized redirect URI;
   - real Turnstile and Rate Limiting verification in preview.
4. Do not enable Google-only signup until required registration preferences can be persisted atomically for that path.
5. Do not add business identity or workspace activation to Better Auth core tables. Those begin in #5.
6. After repository-side #4 work is handed off, begin #5 as a separate business-identity domain slice.
7. Continue in dependency order through #5–#10.

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

Optional local PostgreSQL and auth verification:

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
npm run db:local:down
```

`db:verify:google` verifies provider gating and authorization-request safety without contacting Google. `db:verify:google-linking` verifies authenticated explicit linking initiation, current-password confirmation, zero provider writes before callback, linked-method visibility, credential-preserving unlink and immutable audit evidence.

The auth abuse-control unit suite checks local bypass, remote fail-closed decisions, stable client keys, exhausted limits, `Retry-After`, Turnstile secret isolation and expected-action matching. Link/unlink actions have their own authenticated budgets.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured; live callback completion remains unverified.
- Real Turnstile and Cloudflare Rate Limiting resources are not provisioned.
- Cloudflare Images remains an account-level dependency for later media work.

These blockers do not prevent local policy work, CI, local PostgreSQL tests or production builds. They do prevent claiming that remote auth protection, live OAuth linking or external email delivery is ready.
