# Data model

## Principles

- Fixed core entities remain relational.
- Dynamic textile values are typed rows, not an unvalidated product JSON document.
- Translations are separate rows keyed by locale.
- Template, overlay and taxonomy changes are versioned.
- Historical option values are archived, not deleted.
- Business state machines use explicit enums and transition services.
- Audit and outbox writes accompany privileged or asynchronous state changes.

## Identity and companies

Better Auth owns four core authentication tables:

- `user` — UUID identity, display name, login email, email-verification flag, optional avatar and timestamps
- `session` — UUID session, unique token, expiry, request metadata and owning user
- `account` — credential or external-provider account, password/token material and owning user
- `verification` — expiring verification/reset values keyed by identifier

Deleting a user cascades to sessions and accounts. Provider/account pairs and session tokens are unique. Login email remains authentication data and is not copied into public business-contact fields.

`user_preferences` is a one-to-one OpenMarket domain record keyed by `user.id`. It stores:

- country as the registration-supplied country label;
- preferred UI language constrained to `tr` or `en`;
- intended use constrained to `buyer`, `supplier` or `both`;
- created and updated timestamps.

Signup, `user_preferences` creation and verification-email outbox intent run in one PostgreSQL transaction. A preference constraint failure rolls back the Better Auth user, credential account and outbox writes. Intended use is onboarding direction only; it does not create or activate a buyer or supplier workspace.

OpenMarket extends authentication identity with additional separate domain tables:

- `company_emails`
- `business_identity_reviews`
- `buyer_profiles`
- `supplier_companies`
- `supplier_memberships`
- `supplier_types`
- `supplier_company_types`
- `business_contacts`

One user may have buyer and supplier workspaces. Workspace intent, company-domain verification, buyer activation, supplier activation, memberships, fixed operational roles and public contact data do not live in Better Auth core tables. Supplier membership roles are fixed at launch.

## Catalogue schema engine

Core tables:

- `category_tree_versions`
- `category_nodes`
- `application_contexts`
- `parameter_definitions`
- `measurement_families`
- `unit_definitions`
- `option_sets`
- `option_values`
- `product_templates`
- `category_parameter_rules`
- `application_parameter_rules`
- `claim_rules`

Rules point to versioned definitions. A resolver produces a deterministic field plan from global fields, category ancestry, leaf template, application overlays and claim rules. Resolved output is cached by schema-version key but can always be reproduced.

## Products

- `products`
- `product_translations`
- `product_applications`
- `product_variants`
- `product_attribute_values`
- `product_variant_attribute_values`
- `product_composition_groups`
- `product_composition_lines`
- `product_media`
- `product_claims`

`product_attribute_values` uses typed nullable columns such as text, integer, decimal, boolean, option, measured value/range, dimension and file reference. A database constraint and application validator ensure exactly the value shape allowed by the parameter data type.

Material composition has explicit groups and lines. Percentage totals are validated per group.

## Documents and evidence

- `document_types`
- `company_document_requirements`
- `claim_evidence_requirements`
- `supplier_documents`
- `product_evidence_links`
- `document_reviews`

Object metadata and review state live in PostgreSQL; private file bytes live in R2. Public eligibility is separate from approval and supplier choice.

## RFQ and communication

- `rfqs`
- `rfq_line_items`
- `rfq_line_attribute_values`
- `rfq_attachments`
- `rfq_matches`
- `rfq_responses`
- `rfq_response_lines`
- `conversations`
- `messages`
- `message_attachments`
- `contact_reveals`

A response line references the RFQ line it covers. Matching stores RFQ-specific eligibility and explanation details, never a reusable supplier score.

## Governance and operations

- `notifications`
- `notification_deliveries`
- `reports`
- `content_pages`
- `content_blocks`
- `seo_records`
- `legal_documents`
- `legal_document_versions`
- `legal_acceptances`
- `consent_records`
- `privacy_requests`
- `retention_policies`
- `support_configuration`
- `support_link_events`
- `audit_logs`
- `outbox_events`
- `schema_migration_previews`

`outbox_events` records transactional side-effect intent. Each row has an aggregate, event type, JSON payload, pending/processing/sent/failed state, attempts, availability, expiry and processing metadata. Dispatch queries use the status/availability index; aggregate and expiry indexes support traceability and cleanup.

Authentication outbox payloads contain recipient, `tr`/`en` locale, a fixed template identifier and a token-bearing action URL. They are private operational data, not audit history. Public routes never read them, logs must never include their payload, and a dispatcher must delete or redact expired token-bearing payloads according to the retention policy after delivery evidence no longer requires them. An outbox row proves delivery intent, not successful email delivery.

Support-link events contain only permitted placement, locale, timestamp, consent-eligible context and anonymous/authenticated state. They do not contain donation amounts or inferred donor status.

## Search projection

`search_documents` contains:

- entity type and ID
- locale
- title and summary
- weighted search vector
- category and application identifiers
- supplier type and public evidence facets
- publication timestamp
- projection version

Structured numeric filters such as GSM, dimensions, MOQ and lead time remain indexed relational columns or dedicated facet tables. They are not parsed back out of text.

## Index strategy

Initial indexes prioritize:

- active/public state plus chronology
- supplier/product/category foreign keys
- locale and slug uniqueness
- GIN full-text vectors
- parameter/facet lookup paths
- pending review and expiry queues
- unread conversations/notifications
- audit resource and timestamp
- outbox status and available-at time

Index additions require query evidence; duplicate indexes are rejected.

## Migration strategy

1. Expand schema with backward-compatible columns/tables.
2. Deploy compatible application code.
3. Backfill through resumable jobs.
4. Validate counts and invariants.
5. Switch reads/writes.
6. Contract obsolete structures in a later migration.

Schema-template changes are domain data versions, not only SQL migrations. They require impact previews and audit reasons as defined in `spec.md`.
