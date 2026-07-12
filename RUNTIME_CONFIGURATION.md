# Runtime configuration

This document defines what can run without external accounts, what is emulated locally and what must wait for real Neon or Cloudflare resources.

## Current no-service workflow

No remote service is required to install, format, type-check, test or build the repository.

```bash
npm ci
npm run spec:materialize
npm run verify
npm run dev
```

The current local application exposes the public foundation, A01–A07 auth routes and `/health`. Cloudflare R2 and Queues have deterministic development names in `wrangler.jsonc`; Wrangler uses local emulation for them during default local development. These names are contracts, not proof that remote resources exist.

Auth abuse controls use an explicit local bypass only when `APP_ENV=local`. Preview and production do not use an in-memory or fake limiter: missing `AUTH_RATE_LIMITER`, Turnstile site key or Turnstile secret causes protected actions to fail closed with a generic public error.

## Optional local PostgreSQL

Docker Compose provides an isolated PostgreSQL instance for migration and database-invariant verification. It is not a Worker runtime binding and does not simulate Hyperdrive pooling or caching.

```bash
cp .env.example .env
npm run db:local:up
npm run db:verify
npm run db:local:down
```

The same migration verification runs in GitHub Actions against a fresh PostgreSQL service container. `DATABASE_URL` is used only by Drizzle Kit, verification and administrative scripts. The committed local credentials are development-only defaults for the isolated compose service.

## Runtime contract

`config/runtime-contract.json` is the machine-readable inventory of variables, secrets and bindings. `npm run config:check` verifies that:

- every runtime name is represented in the TypeScript environment declaration;
- secrets are not stored under Wrangler `vars`;
- local examples contain names but no real credentials;
- locally configured R2 and Queue bindings exist in `wrangler.jsonc`;
- ignored secret files cannot be committed accidentally.

Application code may use `inspectRuntimeReadiness` to report missing names, but must never include configuration values in logs or responses.

## Local variables and secrets

Copy `.dev.vars.example` to `.dev.vars` only when working on the related integration:

```bash
cp .dev.vars.example .dev.vars
```

Replace only the values needed for the task. `.dev.vars` and `.env` are ignored. Never paste real values into issues, pull requests, screenshots or handoff documents.

- `.env` is reserved for the direct PostgreSQL connection used by Drizzle Kit and administrative scripts.
- `.dev.vars` is reserved for Worker runtime variables and secrets.
- Non-secret remote values may later move to environment-specific Wrangler `vars` after the final domains and account identifiers are known.

Cloudflare documentation requires sensitive values to use secrets rather than Wrangler `vars` and recommends keeping local secrets in an ignored `.dev.vars` or `.env` file.

## Authentication abuse controls

The repository defines separate budgets for registration, login, forgot-password, verification resend, password reset and Google OAuth initiation. Cloudflare client IP is used for the rate-limit key. A rate-limit decision occurs before Turnstile verification so already-exhausted requests do not consume Siteverify traffic.

Turnstile is required for account creation and recovery-sensitive forms. The browser receives only `TURNSTILE_SITE_KEY`. `TURNSTILE_SECRET_KEY` remains Worker-only and is sent server-to-server to Cloudflare Siteverify together with the browser token, remote IP and expected action. A token issued for one action cannot be reused for another protected form.

Required remote configuration:

- `AUTH_RATE_LIMITER` — Cloudflare Rate Limiting binding;
- `TURNSTILE_SITE_KEY` — non-secret public widget key;
- `TURNSTILE_SECRET_KEY` — Worker secret.

Do not commit a fake rate-limit namespace or Turnstile credential. After provisioning, verify each protected route in an isolated preview environment and record only non-secret identifiers plus the secret names—not their values.

## Hyperdrive

Do not commit a fake Hyperdrive ID. The `HYPERDRIVE` binding remains `external-pending` until a development configuration exists.

After issue #2 provides a real development binding, local Worker development can connect directly to a database by setting the binding-specific process variable documented by Cloudflare:

```bash
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="$DATABASE_URL"
npm run dev
```

This local mode does not exercise Hyperdrive pooling or query caching. Remote Hyperdrive behaviour must be verified against an isolated development database. Do not use `wrangler dev --remote` against production data.

## External resources by delivery point

| Resource                        | Needed now           | First required work                           |
| ------------------------------- | -------------------- | --------------------------------------------- |
| Local PostgreSQL                | Optional             | Migration and database-invariant verification |
| Neon development database       | No                   | Remote migration and runtime verification     |
| Hyperdrive development binding  | No                   | Remote Worker database verification           |
| Private R2 bucket               | No; locally emulated | Issue #7 private document integration         |
| Background Queue and DLQ        | No; locally emulated | Issue #8 transactional outbox delivery        |
| Better Auth secret and URL      | No                   | Remote auth runtime verification               |
| Google OAuth credentials        | No                   | Live Google login                              |
| Turnstile site key and secret   | No                   | Remote abuse-sensitive auth flows              |
| Auth rate-limit binding         | No                   | Remote auth request enforcement                |
| Cloudflare Images account/token | No                   | Product and approved public media work        |
| Email Sending authorization     | No                   | Transactional notification delivery           |

## Remote provisioning rule

Remote resources are created only when their dependent issue starts. Record safe identifiers and resource names in Git, store credentials only in approved secret stores and update `STATUS.md` plus `HANDOFF.md` with verification and rollback evidence.
