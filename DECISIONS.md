# Decisions

Decisions are append-only. Superseded decisions remain for history and link to the replacement.

## 2026-07-12 — Specification version 2.1 is authoritative

**Decision:** Commit the uploaded specification as `spec.md` and treat it as the product source of truth.

**Reason:** The repository was empty and the specification explicitly defines source precedence, phases, acceptance criteria and handoff files.

**Rejected:** Treating the static prototype as equivalent product authority. It contains mock flows and a smaller route inventory.

## 2026-07-12 — Start as a modular monolith

**Decision:** Use one React Router full-stack Worker with domain modules and one PostgreSQL database. Queue consumers may share the Worker entry initially.

**Reason:** The launch scope is broad but workflows are tightly transactional. Premature services would multiply deployments, consistency problems and operational cost without measured need.

**Split trigger:** Isolate a subsystem only for measured throughput, independent failure containment, privileged-data isolation or a distinct deployment cadence.

## 2026-07-12 — Runtime database traffic uses Hyperdrive; migrations do not

**Decision:** Workers open request-scoped PostgreSQL clients through `env.HYPERDRIVE.connectionString`. Drizzle Kit uses a direct Neon `DATABASE_URL` in controlled local/CI environments.

**Reason:** Hyperdrive handles runtime connection pooling, while schema migration tooling needs a stable administrative connection and should not be coupled to request bindings.

## 2026-07-12 — Keep the uploaded prototype as reference-only

**Decision:** Extract the prototype language into `DESIGN_REFERENCE.md` and rebuild production components in React Router.

**Reason:** The prototype is valuable for visual language and screen intent but uses hash routing, mock data and non-persistent interactions.

**Rejected:** Copying the prototype JavaScript into the application and incrementally replacing mocks. That path would preserve the wrong state, routing and accessibility foundations.

## 2026-07-12 — Use plain shared CSS tokens before adding a styling framework

**Decision:** Start with CSS tokens and production components derived from the reference design.

**Reason:** The design explicitly avoids generic card systems, gradients and glassmorphism. A new styling dependency is not justified until repeated production patterns show a need.

## 2026-07-12 — PostgreSQL full-text search is the launch search engine

**Decision:** Build a versioned search-document projection with `tsvector` and GIN indexes in PostgreSQL. Queue jobs refresh projections after product, supplier, category and eligible RFQ changes.

**Reason:** This meets the launch requirement without adding a second search datastore. Revisit only after measured relevance, language or scale limits.

## 2026-07-12 — Use an outbox before publishing state-changing queue jobs

**Decision:** Transactional workflows write domain state, audit records and outbox events together; a dispatcher publishes to Cloudflare Queues.

**Reason:** Direct database-write-then-queue calls create unrecoverable dual-write gaps.

## 2026-07-12 — Pin TypeScript to the supported React Router range

**Decision:** Use TypeScript 6.0.3 for the foundation.

**Reason:** React Router 8.2.0 declares support for TypeScript 5.1 or 6.x. TypeScript 7.0.2 produced a peer-dependency conflict during a clean install.

**Rejected:** Installing with `--force` or `--legacy-peer-deps`. A foundation should not hide an unsupported compiler combination.

## 2026-07-12 — Use a committed npm lockfile and read-only CI

**Decision:** Commit npm lockfile version 3, install with `npm ci --ignore-scripts` in GitHub Actions and keep CI repository permissions read-only.

**Reason:** Pinned direct versions alone do not make transitive dependency resolution reproducible. The lockfile must be updated intentionally with dependency changes.

**Rejected:** Permanent `npm install` in CI, manually authored lockfile content or leaving write permission enabled after one-time lock generation.

## 2026-07-12 — Better Auth owns authentication records only

**Decision:** Use Better Auth's core `user`, `session`, `account` and `verification` models with UUID identifiers. Create the auth instance per request around the request-scoped Drizzle connection.

**Reason:** Authentication identity and session lifecycle belong to Better Auth, while OpenMarket business identity, buyer activation, supplier activation, memberships and public contacts require explicit domain state machines and audit rules.

**Rejected:** Adding workspace intent, business verification, supplier state, roles or public contact fields directly to Better Auth core tables; using a process-global PostgreSQL client in the Worker.

## 2026-07-12 — Registration preferences are separate and transactional

**Decision:** Store country, preferred UI language and Buyer/Supplier/Both intent in a one-to-one `user_preferences` table. Execute Better Auth signup and preference insertion in the same PostgreSQL transaction.

**Reason:** These fields are required at registration but are OpenMarket onboarding data, not authentication identity. Atomic persistence prevents a valid credential account from surviving when required onboarding data fails database validation.

**Rejected:** Adding the fields to Better Auth's `user` table; writing preferences after signup in an unrelated transaction; treating intended use as immediate buyer or supplier activation.

## 2026-07-12 — Authentication email intent is transactional and delivery-independent

**Decision:** Better Auth verification and password-reset callbacks write a typed `outbox_events` record in the same PostgreSQL transaction as the triggering auth operation. The outbox stores recipient, locale, template identifier, token-bearing action URL and expiry; a later dispatcher performs external delivery.

**Reason:** Registration or recovery must not report success while silently losing the required email side effect. Separating intent from delivery also allows local and CI verification without fake SMTP credentials or an unauthorized sender domain.

**Security boundary:** Token-bearing action URLs are private operational data. They are never returned by public routes, included in logs or retained beyond the applicable delivery/expiry policy. Password reset revokes active sessions; unknown-email requests use a generic public response and produce no delivery event.

**Rejected:** Calling an email provider directly inside the auth transaction; committing fake sender credentials; logging verification/reset URLs; treating an outbox record as proof that an email was delivered.

## 2026-07-12 — Google OAuth never bypasses registration or silently links accounts

**Decision:** Configure Google only when both credentials are present and non-placeholder. Request only OpenID, email and profile scopes. Disable Google-only signup, implicit same-email linking, cross-email linking and provider-driven profile overwrite. Start OAuth through a POST-only application route and surface provider results through A03.

**Reason:** OpenMarket registration requires country, preferred language and Buyer/Supplier/Both intent in the same transaction as identity creation. A provider-created user would bypass those required fields. Silent same-email linking also creates account-takeover ambiguity and violates the explicit-linking acceptance criterion.

**Follow-up:** A future authenticated account-settings flow may link Google only after re-authentication and explicit user confirmation. It must test duplicate-provider, unlink, last-login-method and audit behaviour before enabling Google-only signin for that account.

**Rejected:** Enabling Google signup before preferences can be persisted atomically; treating matching email as consent to link; allowing different-email linking; sending the Google client secret to the browser; initiating OAuth from a GET route that can be prefetched.
