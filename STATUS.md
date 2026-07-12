# Project status

**Updated:** 2026-07-12  
**Source of truth:** `spec.md` version 2.1  
**Repository:** `aricansoft2022/openmarket.tr_v1`

## Current phase

Phase 1 — Identity and supplier activation foundation.

## Completed

- Merged Phase 0 foundation through PR #1 using a squash merge.
- Added the React Router v8 + Cloudflare Workers TypeScript scaffold.
- Added reproducible `package-lock.json` installation and read-only GitHub Actions CI.
- Added design tokens, source-of-truth preservation, architecture, data model, seed, test, workflow and handoff documentation.
- Created dependency-ordered Phase 1 issues #2–#10.
- Merged the runtime configuration contract and local R2/Queue emulation through PR #12.
- Merged optional local PostgreSQL and CI migration/audit-invariant verification through PR #13.
- Merged Better Auth core schema, request-scoped Drizzle adapter, `/api/auth/*` handler and signup/signin persistence verification through PR #14.
- Merged transactional `user_preferences`, canonical A01/A02 entry forms and rollback verification through PR #17.
- Merged A04–A07 email verification and password recovery, transactional auth email outbox intent and token lifecycle checks through PR #19.
- Merged guarded Google OAuth policy, POST-only initiation and A03 callback states through PR #20.
- Kept fake Cloudflare resource IDs and credentials out of source control.

## In progress

PR #21 advances issue #4 with:

- per-action budgets for registration, login, password recovery, verification resend, password reset and Google OAuth initiation;
- Cloudflare client-address rate-limit keys;
- server-side Turnstile Siteverify with expected-action validation;
- route-level integration for A01, A02, A04, A06, A07 and Google OAuth start;
- explicit local-only bypass and preview/production fail-closed behaviour;
- public `429`/`503` error mapping without account enumeration;
- separate public Turnstile site key and Worker-only secret;
- unit coverage for exhausted limits, missing infrastructure, action mismatch and secret isolation.

No owner action is required for local development or CI. Remote protected auth forms remain unavailable until a real `AUTH_RATE_LIMITER`, `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are configured.

## Verification

Current branch target:

```text
npm run format:check           PASS
npm run docs:check             PASS
npm run config:check           PASS
npm run typecheck              PASS
npm run test:run               PASS
npm run build                  PASS
npm run db:check               PASS
npm run db:verify              PASS
npm run db:verify:auth         PASS
npm run db:verify:registration PASS
npm run db:verify:recovery     PASS
npm run db:verify:google       PASS
```

The abuse-control unit suite verifies local-only bypass, preview/production fail-closed behaviour, `Retry-After`, Turnstile action matching, server-side secret handling and that an exhausted rate limit prevents a Siteverify request.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured.
- Explicit authenticated Google account-linking UI remains to be built; implicit linking is intentionally blocked.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Buyer/supplier workspace creation and commercial activation remain separate domain work in #5–#8.
- Cloudflare Images account configuration remains an external dashboard task.
- The static prototype remains a reference and does not replace production accessibility or responsive validation.

These are remote integration or later feature blockers, not blockers for local policy validation, UI development, CI or production builds.

## Next tasks

1. Merge PR #21 only after permanent read-only application and PostgreSQL CI jobs pass.
2. Add explicit authenticated Google account linking without silent same-email linking.
3. Add the email outbox dispatcher only when Cloudflare Email Sending authorization exists; never log token-bearing action URLs.
4. Provision Neon, deployed Hyperdrive, Google development credentials, Turnstile and the auth rate-limit binding before claiming remote auth readiness.
5. Begin #5 business-identity verification as a separate domain slice after #4 repository work is closed or explicitly handed off.
6. Continue Phase 1 in dependency order through #5–#9 and close it through integration gate #10.
