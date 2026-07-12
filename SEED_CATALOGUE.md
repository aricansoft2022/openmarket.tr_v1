# Seed catalogue plan

`spec.md` sections 5–12 are authoritative. This file defines seed mechanics and stable identifiers, not a competing catalogue.

## Seed order

1. application contexts
2. measurement families and units
3. option sets and values
4. document and evidence types
5. category tree version and category nodes
6. parameter definitions
7. global textile rules
8. category templates and rules
9. application overlays
10. claim-dependent rules
11. RFQ package templates
12. fixed roles and permissions
13. baseline CMS, legal and support configuration

## Stable keys

Use human-readable, immutable system keys independent of translated names:

```text
context.home_retail
context.hotel_hospitality
context.hospital_healthcare_accommodation
context.dormitory_institutional_accommodation

category.bed_linen.flat_sheets
category.bath_spa.bath_towels
parameter.textile.gsm
option_set.textile_fibres
unit.gsm
role.compliance_reviewer
```

Names, descriptions and slugs are localized data and may change without changing keys.

## Versioning

- Every seed bundle has a semantic data version.
- Seed application is idempotent and transaction-bound.
- Existing historical values are archived rather than deleted.
- Renaming preserves the stable key.
- A category-tree publication creates a new immutable version.
- Template/overlay publication records the resolver version and impact summary.

## Validation

Seed verification checks:

- exactly four active launch application contexts
- no sector outside Home & Contract Textiles
- category parent integrity and unique sibling slugs per locale
- measurement family/unit compatibility
- option-value uniqueness within a set
- translated Turkish and English labels for launch-visible values
- no high-risk claim can resolve to public reviewed display without evidence rules
- fixed roles contain only declared resource/action permissions
- support defaults cannot affect access, matching, ranking or moderation

## Initial implementation batches

- Phase 1: fixed roles, permissions, public-email domain policy defaults and company document types
- Phase 2: categories, parameters, units, options, templates, overlays and claim rules
- Phase 4: RFQ package templates
- Phase 5: legal document types, CMS baseline, consent definitions and support configuration
