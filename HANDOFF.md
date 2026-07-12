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

Phase 0, the runtime-configuration contract, local PostgreSQL verification, Better Auth persistence and transactional registration are merged to `main`. The repository can be installed, built and tested without Neon or a Cloudflare account.

PR #19 adds the next issue #4 slice:

- A04 `/auth/verify-email` pending/resend state;
- A05 `/auth/verify-email/result` success/token-error state;
- A06 `/auth/forgot-password` enumeration-safe request state;
- A07 `/auth/reset-password` password form and invalid-token state;
- canonical `/auth/login` and `/auth/register`, with legacy Turkish redirects;
- required email verification before credential signin;
- transactional verification/reset delivery records in `outbox_events`;
- Turkish and English email-rendering contracts;
- one-hour, single-use token policy and session revocation after reset;
- PostgreSQL evidence for verification, reset, replay and expiry behaviour.

Authentication identity remains separate from business identity, buyer/supplier activation, memberships, roles and public contact data. The outbox contains token-bearing action URLs and is private operational data; it must not be logged, returned by public routes or retained after its delivery/expiry policy allows deletion.

## Exact next tasks

1. Merge PR #19 only after both permanent read-only CI jobs pass.
2. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
3. Continue issue #4 in separate reviewable slices:
   - Google OAuth provider and account-linking rules;
   - A03 `/auth/callback` loading/error/retry states;
   - Turnstile and route-level rate limiting;
   - Cloudflare email dispatcher after sender authorization exists.
4. Do not add business identity or workspace activation to Better Auth core tables. Those begin in #5.
5. Before remote Worker readiness is claimed:
   - provision isolated development Neon and Hyperdrive resources;
   - apply committed migrations through a direct Neon URL;
   - verify `/api/auth/*` and A01–A07 through deployed Hyperdrive;
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
npm run db:verify:recovery
npm run db:local:down
```

`db:verify:recovery` proves that unverified signin is blocked, verification completes once, unknown reset requests do not reveal account existence, reset revokes sessions, the old password stops working, the new password works, token replay fails and expired tokens produce only an error state.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Google OAuth and Turnstile credentials are not configured.
- Cloudflare Images remains an account-level dependency for later media work.

These blockers do not prevent auth schema work, transactional registration, verification/reset token lifecycle checks, local PostgreSQL tests or production builds.
