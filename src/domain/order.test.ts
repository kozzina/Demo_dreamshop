import { describe, expect, it } from "vitest";
import { advance, isFreeToCancel, nextStatus } from "./order";

describe("order status", () => {
  it("moves one step forward", () => {
    expect(advance("new", "accepted")).toEqual({ ok: true, value: "accepted" });
    expect(nextStatus("delivering")).toBe("delivered");
  });

  it("never skips a step or goes back", () => {
    expect(advance("new", "delivering")).toMatchObject({ ok: false, error: "not_next", details: { expected: "accepted" } });
    expect(advance("assembling", "accepted")).toMatchObject({ ok: false, error: "not_next" });
  });

  it("stops at the final statuses", () => {
    expect(advance("delivered", "delivered")).toMatchObject({ ok: false, error: "already_final" });
    expect(advance("cancelled", "accepted")).toMatchObject({ ok: false, error: "already_final" });
  });

  it("is free to cancel only before assembling", () => {
    expect(isFreeToCancel("accepted")).toBe(true);
    expect(isFreeToCancel("assembling")).toBe(false);
  });
});
