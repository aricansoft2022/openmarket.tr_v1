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
- Merged route-level rate limiting, Turnstile policy, local-only bypass and remote fail-closed auth controls through PR #21.
- Kept fake Cloudflare resource IDs and credentials out of source control.

## In progress

The explicit Google account-linking slice advances issue #4 with:

- authenticated `/account/security` settings;
- current-password re-verification before link and unlink;
- separate rate-limit budgets for link and unlink actions;
- explicit `/api/auth/link-social` initiation with session cookies;
- same-email-only policy inherited from the guarded Better Auth configuration;
- linked-provider listing without exposing provider tokens;
- unlink protection that preserves at least one login method;
- immutable audit records for completed Google link and unlink changes;
- PostgreSQL verification for session/password gates, provider redirect, pre-callback zero write, listing, unlink and audit evidence.

No owner action is required for local development or CI. A real Google callback still requires development credentials and an authorized redirect URI.

## Verification

Current branch target:

```text
npm run format:check              PASS
npm run docs:check                PASS
npm run config:check              PASS
npm run typecheck                 PASS
npm run test:run                  PASS
npm run build                     PASS
npm run db:check                  PASS
npm run db:verify                 PASS
npm run db:verify:auth            PASS
npm run db:verify:registration    PASS
npm run db:verify:recovery        PASS
npm run db:verify:google          PASS
npm run db:verify:google-linking  PASS
```

The Google-linking integration test uses dummy CI credentials only to produce the authorization request. It does not contact Google or claim a live callback. A provider-linked fixture is then used to verify account listing, credential preservation, unlink persistence and audit outcomes.

## Known issues and blockers

- A Neon development database and deployed Hyperdrive configuration are not yet provisioned.
- Hyperdrive pooling, caching and remote Worker connectivity cannot be verified until that remote configuration exists.
- `outbox_events` records delivery intent; an external email dispatcher and sender-domain authorization are not yet configured.
- Real Google OAuth credentials and authorized redirect URIs are not configured, so live link callbacks remain unverified.
- Cloudflare Rate Limiting and Turnstile resources are not provisioned, so remote enforcement cannot yet be exercised.
- Buyer/supplier workspace creation and commercial activation remain separate domain work in #5–#8.
- Cloudflare Images account configuration remains an external dashboard task.
- The static prototype remains a reference and does not replace production accessibility or responsive validation.

These are remote integration or later feature blockers, not blockers for local policy validation, UI development, CI or production builds.

## Next tasks

1. Merge the explicit Google account-linking PR only after permanent read-only application and PostgreSQL CI jobs pass.
2. Add the email outbox dispatcher only when Cloudflare Email Sending authorization exists; never log token-bearing action URLs.
3. Provision Neon, deployed Hyperdrive, Google development credentials, Turnstile and the auth rate-limit binding before claiming remote auth readiness.
4. Hand off the remaining external auth integrations and begin #5 business-identity verification as a separate domain slice.
5. Continue Phase 1 in dependency order through #5–#9 and close it through integration gate #10.
