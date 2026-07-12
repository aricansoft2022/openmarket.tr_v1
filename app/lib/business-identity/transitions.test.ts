import { describe, expect, it } from "vitest";

import {
  BusinessIdentityTransitionError,
  buyerIntent,
  emailDomain,
  mergeIntendedUse,
} from "./transitions.server";

describe("business identity transition policies", () => {
  it("normalizes email domains and rejects malformed values", () => {
    expect(emailDomain("  Buyer@Example.COM ")).toBe("example.com");
    expect(() => emailDomain("not-an-email")).toThrow(BusinessIdentityTransitionError);
  });

  it("widens workspace intent without silently deleting an existing workspace", () => {
    expect(mergeIntendedUse("buyer", "supplier")).toBe("both");
    expect(mergeIntendedUse("supplier", "buyer")).toBe("both");
    expect(mergeIntendedUse("both", "buyer")).toBe("both");
    expect(mergeIntendedUse("buyer", "buyer")).toBe("buyer");
  });

  it("keeps buyer eligibility separate from supplier-only intent", () => {
    expect(buyerIntent("buyer")).toBe(true);
    expect(buyerIntent("both")).toBe(true);
    expect(buyerIntent("supplier")).toBe(false);
  });
});
