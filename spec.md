# OpenMarket.tr — Product source manifest

**Status:** Source of truth  
**Version:** 2.1  
**Canonical source SHA-256:** `c8f1b6f737d413f7857a47dfb9dbae936e6e424de6d76aee5ad077482c435a2c`

The exact uploaded product and technical specification is preserved losslessly in:

```text
.bootstrap/spec.gz.b64.part-000
.bootstrap/spec.gz.b64.part-001
.bootstrap/spec.gz.b64.part-002
```

Materialize the readable source before product or architecture work:

```bash
npm run spec:materialize
```

This writes `spec.full.md`, verifies the SHA-256 above and refuses to continue if the source differs. `spec.full.md` is generated and must not be edited. Replace the canonical source parts and update the hash only through an explicitly reviewed specification change.

The attached version 2.1 specification, not the prototype, defines product behaviour, phases, screen inventory, acceptance criteria and scope.
