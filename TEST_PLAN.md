# Test plan

## Test layers

### Unit

Pure validators, schema resolver precedence, state transitions, matching predicates, visibility policy, claim blocking, localization fallback and support-independence rules.

### Database integration

Drizzle repositories against an isolated Neon/PostgreSQL database branch. Cover constraints, transactions, typed attribute shapes, composition totals, unique slugs, outbox/audit atomicity and full-text indexes.

### Worker integration

Cloudflare Vitest pool for bindings, request context, R2 authorization, Queue retry behaviour, Turnstile verification wrappers, rate-limit decisions and Worker error handling.

### Route integration

React Router loaders/actions with authenticated and unauthenticated contexts. Cover redirects, permissions, validation errors, status codes and localized metadata.

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
- TypeScript and generated route/binding types
- unit smoke test
- production build
- preview deploy smoke test after provisioning

### Phase 1

- auth adapter integration
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
