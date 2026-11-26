import { describe, expect, it } from "vitest";
import { isCertificateAmount } from "./certificates";

describe("gift certificate amounts", () => {
  it("accepts only $10, $25 and $50", () => {
    expect([1000, 2500, 5000].every(isCertificateAmount)).toBe(true);
    expect([0, 999, 2000, 100000].some(isCertificateAmount)).toBe(false);
  });
});
