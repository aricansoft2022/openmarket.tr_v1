# Delivery roadmap

The spec defines seven phases. Work proceeds through phase gates; later-phase code may be explored but cannot bypass an earlier gate.

## Phase 0 — Foundation

Outcome: a deployable, documented, testable Worker application with stable architecture and handoff discipline.

Deliverables:

- React Router v8 + Workers scaffold
- CI, formatting, type generation, tests and build
- environment and Cloudflare binding contract
- Drizzle migration path and audit foundation
- design tokens and preserved prototype reference
- architecture, data, seed, test, workflow, status and handoff documents

Exit gate:

- `npm run verify` passes on Node 24
- preview Worker can deploy after resource IDs and secrets are provisioned
- direct Neon migration path is tested
- Phase 1 issue set is ready and dependency-ordered

## Phase 1 — Identity and supplier activation

Outcome: verified users can activate buyer or supplier workspaces under fixed roles.

Critical slices:

1. Better Auth schema, email/password and Google OAuth
2. session and CSRF/security middleware
3. business identity and company-email verification
4. buyer workspace activation
5. supplier company profile, memberships and supplier types
6. private company-document upload to R2
7. document review queue and supplier activation state machine
8. fixed role/permission enforcement and audit coverage

Exit gate: the visitor-to-active-buyer and visitor-to-active-supplier flows work end to end.

## Phase 2 — Textile catalogue and products

Outcome: administrators configure deterministic textile schemas and active suppliers publish complete products.

Critical slices: taxonomy versioning, parameter definitions, option sets, category templates, application overlays, resolver, product drafts, composition, variants, media, publication validation and moderation.

Exit gate: resolved schemas are deterministic and automatic publication respects supplier, field, media and claim rules.

## Phase 3 — Directory and discovery

Outcome: crawlable bilingual public pages support textile-specific product and supplier discovery.

Critical slices: PostgreSQL FTS index, filters, product/supplier pages, editorial component system, localization, metadata, structured data and saved items.

Exit gate: public MVP screens P01–P07 and P12–P18 meet performance, SEO and accessibility targets.

## Phase 4 — RFQ, matching and communication

Outcome: verified buyers publish single or multi-line RFQs and suppliers respond by line item.

Critical slices: RFQ templates, line attributes, matching explanations, responses, context conversations, contact reveal, notifications and queue-backed email.

Exit gate: the hotel package RFQ flow works end to end without payments or open social messaging.

## Phase 5 — Evidence, CMS and governance

Outcome: reviewed claims, content, legal, privacy and donation-support operations are administered safely.

Critical slices: claim rules and evidence, expiry jobs, CMS, SEO, legal versioning, consent, privacy requests, support settings and privacy-safe support-link analytics.

Exit gate: public labels distinguish declarations and reviewed evidence; governance queues and audit trails are complete.

## Phase 6 — Hardening and launch

Outcome: production launch readiness is demonstrated rather than assumed.

Critical slices: WCAG 2.2 AA audit, threat model, rate-limit tuning, load/performance tests, backup and restore drill, search tuning, seed verification, E2E coverage, observability, incident runbooks and deployment rollback.

Exit gate: every launch acceptance criterion in `spec.md` has evidence and an owner.
