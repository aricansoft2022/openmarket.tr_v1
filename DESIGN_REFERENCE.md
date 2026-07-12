# Design reference extraction

The uploaded `openmarket.tr` ZIP contains a static HTML/CSS/JavaScript prototype on branch `frontend-prototype`. It is an example of visual direction and interaction density, not production source code.

## Extracted visual language

- editorial red, black, white and pale-grey palette
- `#111111` ink, `#333333` soft ink, `#666666` muted text
- `#d32f2f` clay red with `#b71c1c` dark state
- `#e0e0e0` thin divider lines
- Instrument Serif-style editorial headlines and Inter-style operational text
- square or 2px-radius controls
- borders and spacing instead of decorative shadows
- 4:3 product media, application-context badges, technical chips and MOQ/evidence footers
- dense, line-based buyer, supplier and admin screens
- sans-serif `OpenMarket.tr` wordmark and straight woven-bar mark without a triangle motif

These values seed production tokens; accessibility contrast and responsive behaviour still require production validation.

## Useful prototype patterns

- public utility bar, sticky header and four-column footer
- editorial hero with large serif statement
- context grid and product/supplier/RFQ cards
- filter sidebar that becomes a drawer
- workspace shell with sidebar navigation
- table, status, notice, empty and form patterns
- supplier declaration and document-reviewed labels shown separately
- donation support kept visually and functionally secondary to commercial flows

## Route coverage

The prototype advertises 106 hash-routed mock views across public, auth, buyer, supplier, admin and system groups. The source-of-truth specification requires 113 designed views and approximately 55–65 reusable page compositions.

Production route inventory must therefore come from `spec.md` section 37. Prototype IDs and route names cannot be treated as complete or canonical.

## Explicitly rejected carry-over

Do not carry these prototype choices into production:

- hash routing
- global mock data
- mock authentication, upload, email or review outcomes
- client-only permission checks
- static fake status values
- one-off component styling
- incomplete loading, error, permission and accessibility states

## Translation rule

When implementing a screen:

1. Use `spec.md` for behaviour, data, permissions, states and screen composition.
2. Use this file for visual rhythm, typography, borders, density and red editorial character.
3. Implement the result with shared React components and production tokens.
4. Record any material deviation in `DECISIONS.md`.
