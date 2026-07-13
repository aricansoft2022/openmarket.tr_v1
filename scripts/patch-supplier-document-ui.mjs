import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function edit(path, transform) {
  const source = readFileSync(path, "utf8");
  const result = transform(source);
  if (result === source) throw new Error(`No changes applied to ${path}.`);
  writeFileSync(path, result);
}

edit("app/lib/supplier/copy.ts", (source) =>
  source
    .replace(
      '      capabilities: "Türler ve kabiliyetler",',
      '      capabilities: "Türler ve kabiliyetler",\n      documents: "Şirket belgeleri",',
    )
    .replace(
      '      capabilities: "Types and capabilities",',
      '      capabilities: "Types and capabilities",\n      documents: "Company documents",',
    ),
);

edit("app/components/supplier-shell.tsx", (source) => {
  let result = source.replace(
    '  { id: "S04", key: "capabilities", href: "/supplier/capabilities" },',
    '  { id: "S04", key: "capabilities", href: "/supplier/capabilities" },\n  { id: "S05", key: "documents", href: "/supplier/documents" },',
  );
  result = result.replaceAll(
    '"S01" | "S02" | "S03" | "S04"',
    '"S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07"',
  );
  result = result.replace(
    '  const copy = supplierCopy(language).shell;\n\n  return (',
    '  const copy = supplierCopy(language).shell;\n  const activeNavigationId = current === "S06" || current === "S07" ? "S05" : current;\n\n  return (',
  );
  result = result
    .replaceAll('item.id === current ? "is-active" : undefined', 'item.id === activeNavigationId ? "is-active" : undefined')
    .replaceAll('item.id === current ? "page" : undefined', 'item.id === activeNavigationId ? "page" : undefined');
  return result;
});

edit("app/root.tsx", (source) =>
  source.replace(
    'import "./styles/supplier.css";',
    'import "./styles/supplier.css";\nimport "./styles/supplier-documents.css";',
  ),
);

edit("app/routes.ts", (source) =>
  source.replace(
    '  route("supplier/capabilities", "routes/supplier.capabilities.tsx"),',
    `  route("supplier/capabilities", "routes/supplier.capabilities.tsx"),
  route("supplier/documents", "routes/supplier.documents.tsx"),
  route("supplier/documents/upload", "routes/supplier.documents.upload.tsx"),
  route("supplier/documents/:documentId", "routes/supplier.documents.$documentId.tsx"),
  route("supplier/document-access/:token", "routes/supplier.document-access.$token.ts"),
  route("admin/supplier-documents", "routes/admin.supplier-documents.tsx"),
  route(
    "admin/supplier-documents/:documentId",
    "routes/admin.supplier-documents.$documentId.tsx",
  ),`,
  ),
);

edit("app/routes.test.ts", (source) =>
  source.replace(
    `    expect(configuredRoutes).toContain('"file":"routes/supplier.capabilities.tsx"');`,
    `    expect(configuredRoutes).toContain('"file":"routes/supplier.capabilities.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/documents"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.documents.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/documents/upload"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.documents.upload.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/documents/:documentId"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.documents.$documentId.tsx"');
    expect(configuredRoutes).toContain('"path":"supplier/document-access/:token"');
    expect(configuredRoutes).toContain('"file":"routes/supplier.document-access.$token.ts"');
    expect(configuredRoutes).toContain('"path":"admin/supplier-documents"');
    expect(configuredRoutes).toContain('"file":"routes/admin.supplier-documents.tsx"');
    expect(configuredRoutes).toContain('"path":"admin/supplier-documents/:documentId"');
    expect(configuredRoutes).toContain('"file":"routes/admin.supplier-documents.$documentId.tsx"');`,
  ),
);

edit("app/lib/supplier/documents/service.server.ts", (source) => {
  let result = source.replace(
    '  type SupplierMembershipRole,',
    '  type SupplierMembershipRole,\n  type SupplierWorkspaceStatus,',
  );
  result = result.replace(
    '  company: { id: string; legalName: string; status: string };',
    '  company: { id: string; legalName: string; status: SupplierWorkspaceStatus };',
  );
  result = result.replace(
    '  companyStatus: string;',
    '  companyStatus: SupplierWorkspaceStatus;',
  );
  return result;
});

for (const path of [
  "app/routes/supplier.documents.tsx",
  "app/routes/supplier.documents.upload.tsx",
  "app/routes/supplier.documents.$documentId.tsx",
]) {
  edit(path, (source) => source.replace('status={workspace.company.status as never}', 'status={workspace.company.status}').replace('status={workspace?.company.status as never}', 'status={workspace?.company.status}'));
}

edit("app/routes/admin.supplier-documents.$documentId.tsx", (source) => {
  let result = source.replace(
    '  return { account, detail };',
    '  return {\n    account,\n    detail,\n    decided: new URL(request.url).searchParams.get("decided") === "1",\n  };',
  );
  result = result.replace(
    `  const decided = new URL(
    typeof window === "undefined" ? "http://localhost" : window.location.href,
  ).searchParams.get("decided");`,
    '  const decided = loaderData.decided;',
  );
  return result;
});

unlinkSync(fileURLToPath(import.meta.url));
