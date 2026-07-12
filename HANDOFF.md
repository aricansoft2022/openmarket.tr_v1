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

Phase 0, the runtime-configuration contract, local PostgreSQL verification and Better Auth persistence are merged to `main`. The repository can be installed, built and tested without Neon or a Cloudflare account. CI runs application verification and PostgreSQL migration/invariant verification as separate read-only jobs.

The current #15 branch adds:

- `user_preferences`, separate from Better Auth core tables;
- required country, Turkish/English UI language and Buyer/Supplier/Both intent;
- one PostgreSQL transaction covering Better Auth signup and preference persistence;
- A01 `/giris`, A02 `/kayit` and A03 `/kayit/basarili` route states;
- server-side validation, loading/error states and responsive red-editorial form styling;
- rollback evidence proving a failed preference write leaves no user or credential account.

Authentication identity remains separate from business identity, buyer/supplier activation, memberships, roles and public contact data. Login email is never copied into public contact fields.

## Exact next tasks

1. Merge #15 only after both CI jobs pass, including `npm run db:verify:registration`.
2. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
3. Continue #4 in separate reviewable slices:
   - account email verification, resend and result routes;
   - forgot/reset password with expiry and replay protection;
   - Turkish/English transactional-email contracts;
   - Google OAuth linking rules;
   - Turnstile and route-level rate limiting.
4. Do not add business identity or workspace activation to Better Auth core tables. Those begin in #5.
5. Before remote Worker readiness is claimed:
   - provision isolated development Neon and Hyperdrive resources;
   - apply committed migrations through a direct Neon URL;
   - verify `/api/auth/*`, `/giris` and `/kayit` through deployed Hyperdrive;
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
npm run db:verify:registration
npm run db:local:down
```

`db:verify:registration` performs one valid signup and then deliberately violates the country constraint. The first case must persist one preference row; the second must roll back the Better Auth user and credential account together.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Email delivery, Google OAuth and Turnstile credentials are not configured; they are not required for #15.
- Cloudflare Images and Email Sending require account-level provisioning outside the repository.

These blockers do not prevent Better Auth schema, transactional local registration, A01/A02 UI, local PostgreSQL checks, tests or production builds.
