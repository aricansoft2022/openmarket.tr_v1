# Engineering workflow

## Work item shape

A work item is a vertical slice with one observable outcome, explicit acceptance criteria and a rollback path. Split work when a PR mixes unrelated domains, exceeds roughly 800 changed handwritten lines or cannot be reviewed independently.

Each issue should state:

- user or operator outcome
- spec section and screen IDs
- data and permission impact
- acceptance criteria
- test plan
- migration, seed, queue and analytics impact
- out-of-scope items

## Branch and PR flow

- `main` is always releasable.
- Branches use `phase/<n>-<scope>`, `feat/<scope>`, `fix/<scope>` or `chore/<scope>`.
- Open a draft PR as soon as the slice has a stable skeleton.
- Rebase or merge `main` before final review; do not rewrite shared branch history after review starts.
- Prefer squash merge for one coherent change set.
- Every PR links an issue or explains why no issue is needed.

Required PR evidence:

- summary and spec references
- screenshots for visible changes
- schema diff and migration notes for database changes
- permission and abuse-case review
- tests run and results
- deployment or rollback notes
- updated `STATUS.md` and `HANDOFF.md` when work crosses sessions or phases

## CI gates

The required verification contract is:

```bash
npm run verify
```

It checks formatting, documentation integrity, generated types, TypeScript, unit tests and the production build. Phase-specific integration, Worker, accessibility and E2E suites are added as their subsystems arrive.

## Database workflow

- Drizzle schema files are authoritative for database structure.
- Generate SQL migrations locally and commit them.
- Apply migrations to preview before production.
- Never edit production tables manually except an approved incident procedure that is immediately codified as a migration.
- Destructive operations require a two-step expand/migrate/contract plan.
- Runtime Workers connect through Hyperdrive; Drizzle Kit uses a direct Neon URL.
- Seed updates are versioned, idempotent and reviewed separately from user data migrations.

## Queue and side-effect workflow

State changes that need email, search indexing, media cleanup or expiry processing write an outbox row in the same database transaction. A dispatcher publishes the outbox record to Cloudflare Queues. Consumers must be idempotent and safe to retry.

## Definition of done

A slice is done only when:

- acceptance criteria are demonstrated
- permissions and failure states are covered
- audit events exist for privileged changes
- tests pass at the right layers
- migration and seed impact is documented
- copy is available in Turkish and English where public
- loading, empty, error, disabled and permission states are implemented
- accessibility checks pass for changed UI
- `STATUS.md`, `HANDOFF.md` and decisions are current
