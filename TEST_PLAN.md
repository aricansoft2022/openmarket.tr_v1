# Test plan

## Test layers

### Unit

Pure validators, runtime configuration readiness, registration/login form validation, schema resolver precedence, state transitions, matching predicates, visibility policy, claim blocking, localization fallback and support-independence rules.

### Database integration

Committed migrations and Drizzle repositories run against isolated PostgreSQL. Pull requests use a fresh GitHub Actions service container; developers may use the optional Docker Compose database. Cover migration metadata, required indexes, constraints, transactions, immutable audit behaviour, Better Auth signup/signin persistence, hashed credential storage, sessions, transactional registration preferences, typed attribute shapes, composition totals, unique slugs, outbox/audit atomicity and full-text indexes. Repeat the same critical checks against an isolated Neon branch before remote deployment.

Auth integration fixtures must verify the core `user`, `account` and `session` writes through Better Auth APIs rather than inserting fixture rows directly. Registration verification must also prove that country/language/intent persistence succeeds atomically and that a forced preference-constraint failure leaves no user or credential account.

### Worker integration

Cloudflare Vitest pool for bindings, request context, auth handler routing, session-cookie behaviour, R2 authorization, Queue retry behaviour, Turnstile verification wrappers, rate-limit decisions and Worker error handling.

### Route integration

React Router loaders/actions with authenticated and unauthenticated contexts. Cover redirects, permissions, validation errors, status codes and localized metadata. A01/A02 tests include loading, invalid email, weak/mismatched password, missing preferences, duplicate-account response and recoverable database failure.

### End to end

Browser flows for visitor, buyer, supplier, reviewer, moderator and admin. Use stable seed fixtures and inspect observable audit/notification outcomes.

### Non-functional

- WCAG 2.2 AA automated and manual checks
- performance budgets and Core Web Vitals for public pages
- security tests for IDOR, upload validation, CSRF, session fixation and claim bypass
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
- email/password signup, credential-account hashing, signin and session persistence
- separate country, UI-language and intended-use preference model
- atomic signup + registration-preference rollback verification
- A01 login, A02 registration and A03 success route states
- request-scoped `/api/auth/*` handler compilation
- real Hyperdrive runtime and direct Neon migration-path verification before remote readiness
- email verification and OAuth callback
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
