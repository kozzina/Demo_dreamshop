import { describe, expect, it } from "vitest";
import { CATALOG, type DreamSlug } from "./catalog";
import { addToCart, cartTotal, setLine, type Cart, type Stock } from "./cart";
import { formatUsd } from "./money";

const stock = Object.fromEntries(CATALOG.map((dream) => [dream.slug, dream.stock])) as Record<DreamSlug, number>;
const TONIGHT = "2026-11-26";
const TOMORROW = "2026-11-27";

function cartOf(...steps: [string, number, string][]): Cart {
  return steps.reduce<Cart>((cart, [slug, qty, night]) => {
    const result = addToCart(cart, stock as Stock, slug, qty, night);
    if (!result.ok) throw new Error(result.error);
    return result.value;
  }, []);
}

describe("cart rules", () => {
  it("adds a dream and sums prices exactly", () => {
    const cart = cartOf(["forest-cabin", 1, TONIGHT], ["no-alarm-sleep", 1, TOMORROW]);
    expect(formatUsd(cartTotal(cart))).toBe("$20.80");
  });

  it("rejects an unknown dream", () => {
    expect(addToCart([], stock, "unicorns", 1, TONIGHT)).toMatchObject({ ok: false, error: "unknown_dream" });
  });

  it("does not sell more than the stock", () => {
    expect(addToCart([], stock, "space-walk", 4, TONIGHT)).toMatchObject({ ok: false, error: "not_enough_stock", details: { available: 2 } });
  });

  it("does not sell an out-of-stock dream", () => {
    expect(addToCart([], stock, "first-snow", 1, TONIGHT)).toMatchObject({ ok: false, error: "not_enough_stock" });
  });

  it("caps one dream at 5 per order, also when added in parts", () => {
    const cart = cartOf(["exam-passed", 3, TONIGHT]);
    expect(addToCart(cart, stock, "exam-passed", 3, TONIGHT)).toMatchObject({ ok: false, error: "qty_limit" });
  });

  it("keeps 'Sleep Without an Alarm' alone on its night", () => {
    const cart = cartOf(["childhood-sea", 1, TONIGHT]);
    expect(addToCart(cart, stock, "no-alarm-sleep", 1, TONIGHT)).toMatchObject({ ok: false, error: "night_conflict", details: { reason: "whole_night_dream" } });
    expect(addToCart(cart, stock, "no-alarm-sleep", 1, TOMORROW).ok).toBe(true);
  });

  it("allows two short dreams per night but not three", () => {
    const cart = cartOf(["cat-cafe", 1, TONIGHT], ["exam-passed", 1, TONIGHT]);
    expect(addToCart(cart, stock, "childhood-sea", 1, TONIGHT)).toMatchObject({ ok: false, error: "night_conflict", details: { reason: "too_many_dreams" } });
  });

  it("moves a dream to another night and removes it with qty 0", () => {
    const cart = cartOf(["library-night", 1, TONIGHT]);
    const moved = setLine(cart, stock, "library-night", 1, TOMORROW);
    expect(moved.ok && moved.value[0].night).toBe(TOMORROW);
    const removed = setLine(cart, stock, "library-night", 0, TONIGHT);
    expect(removed.ok && removed.value).toEqual([]);
  });
});
