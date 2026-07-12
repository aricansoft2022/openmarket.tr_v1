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

Phase 0, the runtime-configuration contract and local PostgreSQL verification are merged to `main`. The repository can be installed, built and tested without Neon or a Cloudflare account. CI runs application verification and PostgreSQL migration/invariant verification as separate read-only jobs.

The current #3 change adds Better Auth's four core models, a request-scoped auth factory around the existing Hyperdrive/Drizzle lifecycle, the `/api/auth/*` resource handler and isolated PostgreSQL signup/signin persistence verification.

Authentication identity remains separate from business identity, buyer/supplier activation, memberships, roles and public contact data.

## Exact next tasks

1. Merge the Better Auth persistence PR only after both CI jobs pass, including `npm run db:verify:auth`.
2. Keep issue #2 open for real development Neon and deployed Hyperdrive evidence.
3. Start #4 in a separate PR series:
   - registration and login screens/routes;
   - account email verification and resend;
   - forgot/reset password with expiry and replay protection;
   - Google OAuth linking rules;
   - Turnstile and route-level rate limiting;
   - localized transactional-email contracts.
4. Do not add business identity or workspace activation to auth core tables. Those begin in #5.
5. Before remote Worker readiness is claimed:
   - provision isolated development Neon and Hyperdrive resources;
   - apply the committed migrations through a direct Neon URL;
   - verify `/api/auth/*` through deployed Hyperdrive;
   - record safe identifiers, secret names without values, verification output and rollback steps.
6. Continue in dependency order through #5–#10.

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
npm run db:local:down
```

The auth persistence verifier runs inside a rolled-back transaction. It creates a user through Better Auth, checks the credential account and password hashing, signs in, and verifies persisted sessions without leaving fixture rows behind.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Email delivery, Google OAuth and Turnstile credentials are not configured; they are not required for this persistence slice.
- Cloudflare Images and Email Sending require account-level provisioning outside the repository.

These blockers do not prevent Better Auth schema, local persistence, route compilation or isolated PostgreSQL integration tests.
