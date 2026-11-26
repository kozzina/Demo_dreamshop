import { describe, expect, it } from "vitest";
import { planSet } from "./plan-set";

const NIGHTS = ["2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"];

describe("planning a set onto nights", () => {
  it("puts the dreams on the first consecutive free nights", () => {
    expect(planSet([], ["forest-cabin", "no-alarm-sleep"], NIGHTS)).toEqual(["2026-11-26", "2026-11-27"]);
  });

  it("skips a night that is already taken by a whole-night dream", () => {
    const cart = [{ slug: "no-alarm-sleep" as const, qty: 1, night: "2026-11-26" }];
    expect(planSet(cart, ["childhood-sea", "cat-cafe"], NIGHTS)).toEqual(["2026-11-27", "2026-11-28"]);
  });

  it("keeps a dream that is already in the cart on its night", () => {
    const cart = [{ slug: "no-alarm-sleep" as const, qty: 1, night: "2026-11-29" }];
    expect(planSet(cart, ["forest-cabin", "no-alarm-sleep"], NIGHTS)).toEqual(["2026-11-26", "2026-11-29"]);
  });

  it("returns null when nothing fits", () => {
    expect(planSet([], ["forest-cabin", "no-alarm-sleep"], ["2026-11-26"])).toBeNull();
  });
});
