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

Phase 0, runtime configuration, local PostgreSQL verification, Better Auth persistence, transactional registration and A04–A07 verification/password recovery are merged to `main`. The repository can be installed, built and tested without Neon, Google or a Cloudflare account.

PR #20 adds the next issue #4 slice:

- conditional Google provider configuration requiring both non-placeholder credentials;
- POST-only `/auth/google` initiation;
- A03 `/auth/callback` success, processing, unavailable, provider-error and account-not-linked states;
- OpenID, email and profile scopes only;
- Google-only signup disabled so country, preferred language and intended-use requirements cannot be bypassed;
- implicit same-email and cross-email linking disabled;
- Google profile overwrite disabled;
- authorization-contract verification for Google host, state, callback URI, scopes, prompt and client-secret protection;
- proof that OAuth initiation creates no user, account or session before callback validation.

The actual provider callback remains Better Auth's `/api/auth/callback/google`; A03 is the application result surface. No live credential is committed. Existing users are not silently linked to Google. Explicit account linking must require an authenticated user and a separate confirmation flow.

## Exact next tasks

1. Merge PR #20 only after both permanent read-only CI jobs pass.
2. Keep issues #2 and #3 open for real development Neon and deployed Hyperdrive evidence.
3. Continue issue #4 in separate reviewable slices:
   - explicit authenticated Google account linking and unlink safeguards;
   - Turnstile verification for registration, recovery and other abuse-sensitive actions;
   - route-level rate-limit policy and tests;
   - Cloudflare email dispatcher after sender authorization exists.
4. Do not enable Google-only signup until required registration preferences can be persisted atomically for that path.
5. Do not add business identity or workspace activation to Better Auth core tables. Those begin in #5.
6. Before remote Worker readiness is claimed:
   - provision isolated development Neon and Hyperdrive resources;
   - configure development Google credentials and exact authorized redirect URI;
   - apply committed migrations through a direct Neon URL;
   - verify `/api/auth/*` and A01–A07 through deployed Hyperdrive;
   - record safe identifiers, secret names without values, verification output and rollback steps.
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
npm run db:local:down
```

`db:verify:google` uses CI-only dummy credentials to generate—but not complete—the Google authorization request. It checks provider gating, Google host, state, callback URI, minimal scopes, prompt, secret exclusion and zero identity/session writes before callback validation.

## Known blockers

- No Neon development database or deployed Hyperdrive configuration has been provisioned.
- Hyperdrive pooling, query caching and Cloudflare-network connectivity remain unverified.
- Outbox records are produced, but Cloudflare Email Sending authorization and the dispatcher are not configured.
- Real Google development credentials and authorized redirect URIs are not configured.
- Explicit Google account linking, Turnstile and route-level rate limiting remain open.
- Cloudflare Images remains an account-level dependency for later media work.

These blockers do not prevent auth policy work, A03 UI states, local PostgreSQL tests or production builds.
