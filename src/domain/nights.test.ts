import { describe, expect, it } from "vitest";
import { addDays, isBookableNight } from "./nights";

const NOW = new Date("2026-11-26T12:00:00Z");

describe("bookable nights", () => {
  it("accepts tonight and up to 30 days ahead", () => {
    expect(isBookableNight("2026-11-26", NOW)).toBe(true);
    expect(isBookableNight(addDays("2026-11-26", 30), NOW)).toBe(true);
  });

  it("rejects the past, too far ahead and malformed dates", () => {
    expect(isBookableNight("2026-11-25", NOW)).toBe(false);
    expect(isBookableNight(addDays("2026-11-26", 31), NOW)).toBe(false);
    expect(isBookableNight("tomorrow", NOW)).toBe(false);
    expect(isBookableNight("2026-13-01", NOW)).toBe(false);
  });
});
