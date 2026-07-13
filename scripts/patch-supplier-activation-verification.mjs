import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = "scripts/verify-supplier-company-foundation.ts";
let source = readFileSync(path, "utf8");

function replaceOnce(search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Activation verification patch target not found:\n${search}`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  '  assert.equal(created.company.status, "supplier_draft");',
  '  assert.equal(created.company.status, "company_documents_required");',
);
replaceOnce(
  '  assert.equal(loaded?.company.status, "supplier_draft");',
  '  assert.equal(loaded?.company.status, "company_documents_required");',
);
replaceOnce(
  '  assert.equal(completeAgain.company.status, "supplier_draft");',
  '  assert.equal(completeAgain.company.status, "company_documents_required");',
);
replaceOnce(
  '    status: "supplier_draft",\n    business_identity_review_id: identity.reviewId,',
  '    status: "company_documents_required",\n    business_identity_review_id: identity.reviewId,',
);
replaceOnce(
  `  const createAudit = auditEvidence.rows.find((row) => row.action === "supplier.company.created");
  assert.equal(createAudit?.new_value.businessIdentityReviewId, identity.reviewId);`,
  `  const createAudit = auditEvidence.rows.find((row) => row.action === "supplier.company.created");
  assert.equal(createAudit?.new_value.businessIdentityReviewId, identity.reviewId);

  const activationTransitions = auditEvidence.rows.filter(
    (row) => row.action === "supplier.activation.status_changed",
  );
  assert.deepEqual(
    activationTransitions.map((row) => [row.old_value.status, row.new_value.status]),
    [
      ["supplier_draft", "company_documents_required"],
      ["company_documents_required", "supplier_draft"],
      ["supplier_draft", "company_documents_required"],
    ],
  );

  const activationOutbox = await client.query(
    \`
      select event_type, payload
      from outbox_events
      where aggregate_type = 'supplier_company'
        and aggregate_id = $1
        and event_type = 'supplier.activation.status_changed'
      order by created_at, id
    \`,
    [created.company.id],
  );
  assert.equal(activationOutbox.rowCount, 3);
  assert.deepEqual(
    activationOutbox.rows.map((row) => row.payload.nextStatus),
    ["company_documents_required", "supplier_draft", "company_documents_required"],
  );`,
);
replaceOnce(
  `    "Supplier company foundation verified: literal taxonomy constraints, supplier intent and identity-bound evidence gates, owner creation, membership isolation, viewer denial, legal-name drift denial, editor update, seeded taxonomy enforcement, deterministic completeness, draft-state preservation and reconstructable immutable audit evidence passed.",`,
  `    "Supplier company foundation verified: literal taxonomy constraints, supplier intent and identity-bound evidence gates, owner creation, membership isolation, viewer denial, legal-name drift denial, editor update, seeded taxonomy enforcement, deterministic completeness, activation prerequisite transitions, transactional outbox events and reconstructable immutable audit evidence passed.",`,
);

writeFileSync(path, source);
unlinkSync(fileURLToPath(import.meta.url));
