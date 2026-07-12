# Architecture

## System shape

OpenMarket.tr starts as a modular monolith deployed to Cloudflare Workers.

```text
Browser / crawler
  → Cloudflare edge controls
  → React Router Worker
      → route loader/action or resource route
      → domain service
      → repository / policy / audit
      → Hyperdrive
      → Neon PostgreSQL

Worker side effects
  → transactional outbox
  → Cloudflare Queues
  → idempotent consumers
      → search projection
      → email notification
      → document expiry
      → media cleanup
```

Public routes render SSR HTML for crawlability. Buyer, supplier and admin routes share authenticated shells but keep authorization in server loaders/actions, never only in navigation visibility.

## Domain boundaries

- `identity`: Better Auth identities, sessions, verification and business identity
- `companies`: buyer profiles, supplier companies, memberships, supplier types and contacts
- `catalogue`: categories, parameters, units, option sets, templates, overlays and schema resolution
- `products`: products, translations, applications, attributes, variants, media and publication
- `evidence`: document rules, supplier documents, product evidence and reviews
- `rfq`: projects, line items, dynamic requirements, matching and responses
- `communication`: context conversations, messages and contact reveal
- `discovery`: search projections, filters, editorial collections and saved entities
- `governance`: CMS, SEO, legal, consent, privacy, support configuration and audit
- `operations`: reports, moderation, notifications, queues and scheduled work

A domain may call another domain through an explicit service contract. Route modules do not write directly to unrelated tables.

## Cloudflare services

### Workers and React Router

The Worker is the HTTP and queue entry point. React Router framework mode provides SSR, loaders/actions, route-level error boundaries and typed route modules.

### Hyperdrive and Neon

- Runtime: one PostgreSQL client per request or unit of work using the Hyperdrive connection string.
- Close clients deterministically.
- Transactions remain inside domain services.
- Migrations and controlled seed operations use a direct Neon connection outside the Worker runtime.

### R2

R2 stores private company documents, claim evidence, RFQ attachments and message attachments. Objects are private by default. Access passes through an authorized application route or short-lived signed mechanism with ownership, role and sensitivity checks. Permanent public R2 URLs are prohibited.

### Cloudflare Images

Cloudflare Images stores public catalogue imagery and approved public company imagery. Uploads use controlled one-time upload flows. Database rows retain provider IDs, ordering, alt text, moderation state and ownership.

### Queues

Queues handle search projection updates, email dispatch, notification fan-out, document expiry/replacement, privacy exports and media cleanup. Consumers are idempotent, retry-safe and dead-letter aware.

### Turnstile and rate limiting

Turnstile protects registration, password recovery, contact, public enquiry and abuse-prone publication actions. Server-side token verification is mandatory. Cloudflare Rate Limiting protects coarse endpoints; application and Better Auth rules enforce identity-aware limits.

### Email Sending

Email is outbound infrastructure, not the source of truth for notification state. A notification record is committed first, then queued. Templates are localized and versioned. Sensitive document links are never embedded as permanent URLs.

## Search

The launch uses PostgreSQL full-text search:

- a normalized `search_documents` projection per searchable entity and locale
- weighted `tsvector` columns
- GIN indexes
- explicit structured filters outside the text vector
- chronology only when selected
- no hidden quality score, paid boost or donation signal

Queue consumers refresh projections. Reindex jobs are resumable and versioned.

## Authentication and authorization

Better Auth owns core identity/session tables. OpenMarket owns business profiles, workspace states and fixed operational roles.

Authorization layers:

1. authenticated session
2. business identity or supplier activation state
3. workspace membership
4. fixed resource/action permission
5. resource ownership or review assignment
6. field-level visibility and evidence state

Every privileged mutation validates all relevant layers server-side and writes an audit entry.

## Audit

Audit records are append-only and include actor, effective role, resource, action, before/after values, reason, timestamp and request/session/network metadata. Application code must not update or delete audit rows. Database-level immutability controls are added before admin workflows launch.

## Security boundaries

- Secrets exist only in Worker secrets or protected CI environments.
- Login email and business contact data are separate.
- Private documents use deny-by-default authorization.
- High-risk claims are blocked from reviewed public presentation until evidence approval.
- Medical devices, sterile products, PPE and surgical textiles remain blocked regardless of uploaded evidence.
- Donation/support activity cannot enter ranking, matching, activation, moderation or segmentation logic.

## Deployment environments

- `local`: Wrangler/Vite runtime with safe local variables and no production data
- `preview`: isolated Worker deployment and development database branch
- `production`: protected environment with approved migrations and manual promotion

Preview and production must use separate binding IDs, databases, buckets, image accounts/tokens where feasible, queues and secrets.
