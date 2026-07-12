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

The current local application exposes `/` and `/health`. Cloudflare R2 and Queues have deterministic development names in `wrangler.jsonc`; Wrangler uses local emulation for them during default local development. These names are contracts, not proof that remote resources exist.

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

## Hyperdrive

Do not commit a fake Hyperdrive ID. The `HYPERDRIVE` binding remains `external-pending` until a development configuration exists.

After issue #2 provides a real development binding, local Worker development can connect directly to a database by setting the binding-specific process variable documented by Cloudflare:

```bash
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="$DATABASE_URL"
npm run dev
```

This local mode does not exercise Hyperdrive pooling or query caching. Remote Hyperdrive behaviour must be verified against an isolated development database. Do not use `wrangler dev --remote` against production data.

## External resources by delivery point

| Resource | Needed now | First required work |
| --- | --- | --- |
| Neon development database | No | Issue #2 migration and runtime verification |
| Hyperdrive development binding | No | Issue #2 runtime verification |
| Private R2 bucket | No; locally emulated | Issue #7 private document integration |
| Background Queue and DLQ | No; locally emulated | Issue #8 transactional outbox delivery |
| Better Auth secret and URL | No | Issue #3 auth persistence |
| Google OAuth credentials | No | Issue #4 Google login |
| Turnstile secret | No | Issue #4 abuse-sensitive auth flows |
| Cloudflare Images account/token | No | Product and approved public media work |
| Email Sending authorization | No | Transactional notification delivery |

## Remote provisioning rule

Remote resources are created only when their dependent issue starts. Record safe identifiers and resource names in Git, store credentials only in approved secret stores and update `STATUS.md` plus `HANDOFF.md` with verification and rollback evidence.
