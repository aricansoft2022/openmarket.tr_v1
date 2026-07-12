import { describe, expect, it } from "vitest";

import { createHealthPayload } from "../../app/lib/health/create-health-payload";

describe("createHealthPayload", () => {
  it("returns stable service metadata", () => {
    const checkedAt = new Date("2026-07-12T00:00:00.000Z");

    expect(createHealthPayload("preview", "abc123", checkedAt)).toEqual({
      status: "ok",
      service: "openmarket-tr",
      environment: "preview",
      commitSha: "abc123",
      checkedAt: "2026-07-12T00:00:00.000Z",
    });
  });
});
