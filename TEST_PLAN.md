# Test plan

## Test layers

### Unit

Pure validators, runtime configuration readiness, Google OAuth readiness/callback mapping, registration/login/recovery form validation, bilingual auth-email rendering, auth abuse-control budgets including account link/unlink, client-key construction, local bypass, remote fail-closed decisions, Turnstile action matching, email-domain normalization, workspace-intent widening, buyer-intent predicates, fixed platform role/action permissions, staff-management hierarchy and self-management denial, Supplier onboarding dependency/checklist policy, account-language Supplier copy selection, Supplier form normalization, schema resolver precedence, state transitions, matching predicates, visibility policy, claim blocking, localization fallback and support-independence rules.

Supplier onboarding unit evidence must include:

- business identity verification blocks company-profile creation until complete;
- capabilities remain blocked until an identity-bound Supplier company exists;
- company documents remain an explicit incomplete activation dependency after profile and capability completion;
- progress and first-action selection remain deterministic;
- Turkish and English checklist/form-error copy follows the stored account preference;
- repeated checkbox values are trimmed and deduplicated;
- blank optional fields normalize to `null`;
- valid and invalid founded-year input is passed deterministically into domain validation;
- export-market codes are trimmed, uppercased and deduplicated.

### Database integration

Committed migrations and Drizzle repositories run against isolated PostgreSQL. Pull requests use a fresh GitHub Actions service container; developers may use the optional Docker Compose database. Cover migration metadata, required indexes, constraints, transactions, immutable audit behaviour, Better Auth signup/signin persistence, hashed credential storage, sessions, transactional registration preferences, verification/reset outbox atomicity, token expiry/replay, Google authorization-contract generation, explicit account-linking safeguards, business-identity and buyer-activation transitions, fixed staff assignments, effective-role authorization, audited assignment management, Supplier launch catalogue seeding, identity-bound Supplier company persistence, Supplier profile completeness and membership permissions, private Supplier-document lifecycle, typed attribute shapes, composition totals, unique slugs, outbox/audit atomicity and full-text indexes. Repeat the same critical checks against an isolated Neon branch before remote deployment.

Auth integration fixtures must verify core writes through Better Auth APIs rather than inserting fixture rows directly, except when a provider-linked fixture is explicitly needed to test post-callback management without claiming a live provider callback. Required evidence includes:

- signup persists the user and hashed credential account;
- registration persists preferences and verification outbox intent in one transaction;
- a forced preference failure leaves no user, account or outbox row;
- duplicate signup does not overwrite preferences;
- unverified credential signin is blocked;
- verification succeeds once and changes the user flag;
- unknown-email reset requests return generic success without delivery intent;
- reset changes the password, revokes sessions and rejects replay/expired tokens;
- incomplete or placeholder Google credentials do not enable the provider;
- configured Google initiation generates an authorization URL with state, the Better Auth callback, OpenID/email/profile scopes and no client secret;
- OAuth initiation creates no user, account or session before callback validation;
- account linking requires an authenticated session and current-password verification;
- a duplicate Google link is rejected and different-email/profile-overwrite policies remain disabled;
- linked providers are listed without access, refresh or ID tokens;
- unlinking Google preserves the credential method and rejects removal of the last login method;
- completed link and unlink changes create immutable, idempotent audit records without provider tokens or provider-issued identifiers.

Business-identity database evidence must include:

- account verification is required before identity submission;
- an exactly matching verified company-domain account email can verify automatically;
- a public-email domain creates a pending manual-exception review and never activates the buyer automatically;
- a blocked domain creates rejected company-email and review state;
- a separate company email remains pending until its own verification path completes;
- an approved company-domain exception follows the explicit exception policy;
- manual approval activates Buyer only when intended use contains Buyer;
- supplier-only intent does not create a buyer profile;
- Buyer plus Supplier selection widens to Both and is not silently narrowed;
- a decided review cannot be decided again;
- rejected decisions require a reason;
- active buyer state requires verified-review evidence and activation timestamp;
- commercial buyer guards deny browser or suspended state;
- submissions, decisions and workspace expansion create immutable audit evidence.

Business-identity staff authorization evidence must include:

- anonymous access redirects or fails without disclosing review data;
- Product/RFQ Moderator, catalogue editor, privacy/support and accounts without staff assignments cannot list, read or decide business-identity reviews;
- revoked Reviewer/Admin assignments are denied on the next request even when an existing session remains valid;
- only active Compliance Reviewer, Platform Admin and Super Admin assignments resolve the required fixed permissions;
- a staff user cannot list or decide their own application;
- queue and detail projections expose only necessary applicant and evidence metadata and never expose R2 object keys;
- private staff evidence downloads require both permission and matching pending review/evidence identifiers;
- verification and rejection use the shared transition service, rejection requires a reason and a decided review cannot be decided again;
- verified decisions activate Buyer only when Buyer intent exists and do not activate Supplier;
- privileged audit evidence stores the effective staff role and mandatory reason;
- permission-denied, empty, read-only, validation and success states render for the staff routes.

Platform staff assignment management evidence must include:

- anonymous users and non-manager roles cannot list or mutate staff assignments;
- Platform Admin can manage operational roles but cannot grant or revoke Platform Admin or Super Admin;
- Super Admin can manage administrator and operational roles;
- no manager can grant or revoke their own assignments;
- grants require an existing account identified by normalized exact email and a mandatory reason;
- duplicate active user/role grants are rejected;
- regranting a revoked user/role reuses the existing unique row and clears revocation fields;
- revocation requires an active assignment and a mandatory reason;
- grants and revocations affect permission resolution on the next request without session renewal;
- immutable audit evidence records actor, effective manager role, old/new values, reason and request identifier;
- `/admin/staff` covers permission denied, list, validation, successful grant, active, revoked and successful reactivation states.

Supplier catalogue and company database evidence must include:

- the exact six active launch Supplier types, stable keys, bilingual labels and deterministic ordering;
- the reviewed narrow production-capability catalogue, repeated idempotent seeding, canonical repair and non-launch deactivation;
- Supplier/Both intent plus matching verified business identity are required before company creation;
- the company remains bound to the verified review and legal-name drift is rejected;
- active membership scopes every read and mutation, with cross-company access denied;
- owner/admin/editor can edit while viewer is denied server-side;
- unseeded Supplier types or production capabilities are rejected;
- Supplier type and application context are required for completeness while production capability remains optional for non-manufacturing roles;
- profile changes preserve Supplier activation state and create immutable complete old/new audit evidence.

Supplier company-document database evidence must include:

- the canonical document-type catalogue and Supplier-type requirement rules seed idempotently and repair canonical values;
- mandatory requirements resolve deterministically without allowing user-defined document types;
- object keys are server-generated and private, file metadata is constrained and SHA-256 is stored only after private storage succeeds;
- upload, scan, submission, review, expiry and replacement transitions obey database constraints;
- active membership scopes Supplier reads and writes, while outsiders receive a non-disclosing not-found result;
- only active fixed-role reviewers may list, read and decide documents;
- reviewers cannot decide evidence for a company they belong to;
- short-lived grants are user-bound, single-use and rejected after expiry or revocation;
- replacement versions preserve prior evidence and mandatory-requirement continuity;
- review decisions write effective-role audit evidence and review-history UPDATE/DELETE is rejected by PostgreSQL.

### Worker integration

Cloudflare Vitest pool for bindings, request context, auth handler routing, session-cookie behaviour, OAuth state/callback handling, explicit link-social and unlink-account forwarding, R2 authorization, Queue retry behaviour, Turnstile Siteverify wrappers, expected-action rejection, Rate Limiting binding decisions and Worker error handling.

Remote abuse-control evidence must cover:

- a permitted request reaches the protected action;
- an exhausted limit returns `429` plus `Retry-After` without calling Turnstile;
- missing, invalid and wrong-action Turnstile tokens are rejected;
- missing rate-limit or Turnstile infrastructure fails closed in preview/production;
- only the public site key reaches rendered HTML;
- account-recovery responses remain enumeration-safe after the guard is applied;
- account link and unlink use independent authenticated budgets.

### Route integration

React Router loaders/actions with authenticated and unauthenticated contexts. Cover redirects, permissions, validation errors, status codes and localized metadata. A01–A07 tests include loading, invalid email, weak/mismatched password, missing preferences, duplicate-account response, Google unavailable/account-not-linked/rate-limited/security-unavailable/provider-error/success states, verification resend, generic reset success, token error, recoverable database failure and successful reset return-to-login. `/account/security` covers unauthenticated redirect, provider listing, wrong-password rejection, Google unavailable, duplicate link, explicit link redirect, successful link state, last-method unlink block, successful unlink and audit outcomes.

A08–A10 route tests must cover Buyer/Supplier/Both selection, account-not-verified redirect, public-domain explanation, blocked-domain rejection, same-company-email automatic verification, separate-company-email pending state, manual-exception submission, pending timeline, rejection reason, resubmission, permission denial and active-buyer continuation. UI routes must call transition services rather than duplicating state rules.

Staff review routes must cover unauthenticated redirect, permission-denied X04 state, unrelated-role denial, revoked assignment, self-review denial, empty queue, pending detail, safe evidence metadata, private evidence download, missing/rejected decision reason, successful verify/reject and immutable effective-role audit outcomes.

Staff management routes must cover unauthenticated redirect, non-manager denial, hierarchy enforcement, self-management denial, unknown-account and duplicate-active errors, successful grant, reason validation, successful revoke, revoked-row reactivation and audit outcomes.

Supplier S01–S04 route tests must cover:

- route registration exactly once for `/supplier`, `/supplier/onboarding`, `/supplier/company` and `/supplier/capabilities`;
- unauthenticated and unverified-account redirects;
- no-Supplier-intent and unverified-business-identity blocked states;
- no-company empty state and identity-bound company creation;
- overview activation banner, deterministic progress and disabled future-module summaries;
- checklist complete/open/blocked states and first continuation action;
- company form validation, save success, error recovery and export-market normalization;
- capability selection from only the seeded catalogues and fixed application contexts;
- preservation of capability fields during company edits and company/export fields during capability edits;
- owner/admin/editor edit access, viewer read-only rendering and viewer mutation denial;
- Turkish/English shell, checklist and public form-error output from account preference;
- loading fallback, route error, empty, permission, validation, success and read-only UI states;
- no profile or capability action changes Supplier activation status.

Supplier S05–S07 and Admin D17–D18 route tests must cover:

- route registration exactly once for list, upload, detail, access-grant, review queue and review detail routes;
- unauthenticated, cross-company, viewer mutation and unrelated staff-role denial;
- missing, uploaded, scan-pending, pending-review, approved, rejected, expired and replacement-required states;
- Turkish/English copy, loading, empty, recoverable error, permission, validation, success and read-only states;
- file-type, size, issue/expiry metadata and replacement-target validation;
- private download headers, expiring single-use grants and no object-key disclosure;
- reviewer-company conflict denial, mandatory rejection/replacement reasons and immutable timelines;
- document approval never directly changes Supplier activation state.

### End to end

Browser flows for visitor, buyer, supplier, reviewer, moderator and admin. Use stable seed fixtures and inspect observable audit/notification outcomes. Live Google, link-callback and remote Turnstile/rate-limit E2E remain disabled until development credentials, authorized redirect URIs and Cloudflare bindings exist. Fixture-based post-callback tests must be labeled as such and never reported as live OAuth evidence. Company-email delivery, deployed private-R2 E2E and commercial Supplier activation remain disabled until the required external resources and later Phase 1 slices exist. Local and CI company-document upload/review are covered by unit, route, migration and PostgreSQL lifecycle evidence.

### Non-functional

- WCAG 2.2 AA automated and manual checks
- performance budgets and Core Web Vitals for public pages
- security tests for IDOR, upload validation, CSRF, OAuth state, silent linking, callback open redirects, stale sessions, password re-verification, last-method lockout, session fixation, account enumeration, token leakage/replay, Turnstile action reuse, rate-limit bypass, public-domain bypass, review double-decision, self-review, revoked-role access, self-role escalation, manager hierarchy bypass, Supplier cross-company access and claim bypass
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
- conditional Google provider readiness and POST-only initiation
- A03 Google callback states
- minimal Google scopes, state and callback URI verification
- disabled Google signup and implicit/cross-email linking
- zero identity/session writes before Google callback validation
- committed per-action rate-limit and Turnstile policy
- local-only abuse-control bypass and remote fail-closed behaviour
- route-level guards for A01, A02, A04, A06, A07 and Google initiation
- explicit authenticated Google link/unlink route with password re-verification
- provider listing without token disclosure
- last-login-method preservation and immutable link/unlink audit evidence
- real Google callback, Turnstile and Cloudflare Rate Limiting verification before remote readiness
- real Hyperdrive runtime and direct Neon migration-path verification before remote readiness
- external email dispatcher verification after sender authorization
- separate domain-policy, company-email, review and buyer-profile schema
- public-email manual-review and blocked-domain rejection tests
- verified company-domain automatic identity path
- workspace intent widening without loss
- active-buyer gating and immutable transition audit evidence
- A08–A10 responsive and accessible route states
- private manual-exception evidence and reviewer authorization
- fixed-role staff assignment and request-time effective-role resolution
- self-review, unrelated-role and revoked-assignment denial
- administrator-only audited staff assignment lifecycle and hierarchy enforcement
- exact Supplier launch catalogue and idempotent production seed verification
- verified-identity-bound Supplier company/profile and fixed membership-role enforcement
- deterministic minimum-profile completeness without implicit activation
- S01–S04 Supplier overview, checklist, company and capabilities routes
- Turkish/English Supplier shell, checklist and public validation copy
- Supplier onboarding route, normalization and read-only-state tests
- explicit company/workspace selection before multi-company UI exposure
- authoritative or explicitly format-only country-code semantics
- private Supplier document catalogue, upload, scan, review, access-grant and replacement lifecycle
- cross-company non-disclosure and reviewer-company conflict denial
- immutable Supplier document review history and effective-role audit records
- deployed private-R2 integration evidence before remote readiness
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
