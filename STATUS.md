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
- Kept fake Cloudflare resource IDs and credentials out of source control.

## In progress

PR #20 advances issue #4 with:

- Google provider readiness that requires both real credentials;
- POST-only `/auth/google` initiation and A03 `/auth/callback` states;
- OpenID, email and profile scopes only;
- disabled Google-only signup so required registration preferences cannot be bypassed;
- disabled implicit and cross-email account linking;
- no Google profile overwrite of OpenMarket profile data;
- PostgreSQL-backed verification of authorization URL, state, callback URI, scopes, secret protection and zero pre-callback identity/session writes.

No owner action is required for the current local or CI work. A live Google login cannot be completed until real development credentials and authorized redirect URIs exist.

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

The Google policy integration check uses dummy CI-only values to generate the Better Auth authorization URL without contacting Google. It verifies that the browser URL targets Google, contains state and the expected callback/scopes, excludes the client secret and creates no user, account or session before callback validation.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured.
- Explicit authenticated Google account-linking UI remains to be built; implicit linking is intentionally blocked.
- Turnstile and route-level rate limiting remain open within #4.
- Buyer/supplier workspace creation and commercial activation remain separate domain work in #5–#8.
- Cloudflare Images account configuration remains an external dashboard task.
- The static prototype remains a reference and does not replace production accessibility or responsive validation.

These are later integration or deployment blockers, not blockers for local policy validation, A03 UI states or CI authorization-contract tests.

## Next tasks

1. Merge PR #20 only after permanent read-only application and PostgreSQL CI jobs pass.
2. Add explicit authenticated Google account linking without silent same-email linking.
3. Add Turnstile and route-level rate limiting for abuse-sensitive auth actions.
4. Add the email outbox dispatcher only when Cloudflare Email Sending authorization exists; never log token-bearing action URLs.
5. Provision Neon, deployed Hyperdrive and real Google development credentials before claiming remote auth readiness.
6. Continue Phase 1 in dependency order through #5–#9 and close it through integration gate #10.
