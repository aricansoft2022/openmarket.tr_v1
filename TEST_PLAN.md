# Test plan

## Test layers

### Unit

Pure validators, runtime configuration readiness, registration/login/recovery form validation, bilingual auth-email rendering, schema resolver precedence, state transitions, matching predicates, visibility policy, claim blocking, localization fallback and support-independence rules.

### Database integration

Committed migrations and Drizzle repositories run against isolated PostgreSQL. Pull requests use a fresh GitHub Actions service container; developers may use the optional Docker Compose database. Cover migration metadata, required indexes, constraints, transactions, immutable audit behaviour, Better Auth signup/signin persistence, hashed credential storage, sessions, transactional registration preferences, verification/reset outbox atomicity, token expiry/replay, typed attribute shapes, composition totals, unique slugs, outbox/audit atomicity and full-text indexes. Repeat the same critical checks against an isolated Neon branch before remote deployment.

Auth integration fixtures must verify core writes through Better Auth APIs rather than inserting fixture rows directly. Required evidence includes:

- signup persists the user and hashed credential account;
- registration persists preferences and verification outbox intent in one transaction;
- a forced preference failure leaves no user, account or outbox row;
- duplicate signup does not overwrite preferences;
- unverified credential signin is blocked;
- verification succeeds once and changes the user flag;
- unknown-email reset requests return generic success without delivery intent;
- reset changes the password, revokes sessions and rejects replay/expired tokens.

### Worker integration

Cloudflare Vitest pool for bindings, request context, auth handler routing, session-cookie behaviour, R2 authorization, Queue retry behaviour, Turnstile verification wrappers, rate-limit decisions and Worker error handling.

### Route integration

React Router loaders/actions with authenticated and unauthenticated contexts. Cover redirects, permissions, validation errors, status codes and localized metadata. A01–A07 tests include loading, invalid email, weak/mismatched password, missing preferences, duplicate-account response, verification resend, generic reset success, token error, recoverable database failure and successful reset return-to-login.

### End to end

Browser flows for visitor, buyer, supplier, reviewer, moderator and admin. Use stable seed fixtures and inspect observable audit/notification outcomes.

### Non-functional

- WCAG 2.2 AA automated and manual checks
- performance budgets and Core Web Vitals for public pages
- security tests for IDOR, upload validation, CSRF, session fixation, account enumeration, token leakage/replay and claim bypass
- load tests for search, product pages, RFQ publication and queue consumers
- backup restore and migration rollback drills

## Phase gates

### Phase 0

- documentation contract
- runtime variable/binding/secret contract
- TypeScript and generated route/binding types
- unit smoke test
- production build
- preview deploy smoke test after provisioning

### Phase 1

- local R2 and Queue binding emulation
- isolated PostgreSQL migration application on every pull request
- required audit indexes and UPDATE/DELETE immutability trigger verification
- Better Auth core-schema migration
- email/password signup, credential-account hashing and verified signin/session persistence
- separate country, UI-language and intended-use preference model
- atomic signup + registration-preference + verification-outbox rollback verification
- canonical A01–A07 route states and legacy redirects
- required email verification before credential signin
- Turkish/English verification and reset email contracts
- one-hour, single-use verification/reset tokens
- enumeration-safe forgot-password behaviour
- password-reset session revocation
- request-scoped `/api/auth/*` handler compilation
- real Hyperdrive runtime and direct Neon migration-path verification before remote readiness
- Google OAuth callback and account linking
- Turnstile and route-level rate limiting
- external email dispatcher verification after sender authorization
- business identity state transitions
- supplier document private access
- role/action matrix tests from `spec.md` section 29
- activation gating and audit records

### Phase 2

- deterministic schema resolver snapshots
- rule-precedence property tests
- typed attribute validation
- composition total enforcement
- automatic publication and blocked-claim tests
- migration-impact preview fixtures

### Phase 3

- Turkish and English FTS relevance fixtures
- structured filter combinations
- no hidden or paid ranking signals
- canonical/hreflang/structured-data tests
- responsive and keyboard navigation across public MVP screens

### Phase 4

- single and multi-line RFQ flows
- hard/soft/informational matching separation
- line-level response coverage
- context-bound conversation authorization
- contact reveal logging
- notification idempotency

### Phase 5

- evidence state and expiry transitions
- high-risk claim visibility rules
- legal version acceptance
- consent gating and privacy exports/deletion
- support analytics minimization and donation-independence invariants

### Phase 6

- complete launch acceptance matrix
- penetration/security review
- peak-load and queue-backlog tests
- backup restore evidence
- production deployment and rollback rehearsal

## Required states for UI tests

Every major list, detail and form test set includes loading, empty, recoverable error, permission denied, disabled/read-only, success and validation states at desktop and mobile breakpoints.
