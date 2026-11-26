import { findDream, type DreamSlug } from "./catalog";
import { formatUsd, multiply, sum, type Cents } from "./money";
import { fail, ok, type Result } from "./result";

/** Shop rules from content/knowledge.md, section 3. */
export const MAX_QTY_PER_DREAM = 5;
export const MAX_DREAMS_PER_NIGHT = 2;
export const MAX_MINUTES_PER_NIGHT = 360;

/** ISO date of the night the dream is delivered, e.g. "2026-11-28". */
export type Night = string;

export interface CartLine {
  slug: DreamSlug;
  qty: number;
  night: Night;
}

export type Cart = readonly CartLine[];

export type Stock = Readonly<Record<DreamSlug, number>>;

export type CartError = "unknown_dream" | "bad_qty" | "not_enough_stock" | "qty_limit" | "night_conflict";

export type NightConflict = "whole_night_dream" | "too_many_dreams" | "too_long";

/**
 * Sets the quantity and night of one dream in the cart (qty 0 removes it).
 * Every rule is checked here, on the server — the assistant and the UI only call this.
 */
export function setLine(cart: Cart, stock: Stock, slug: string, qty: number, night: Night): Result<Cart, CartError> {
  const dream = findDream(slug);
  if (!dream) return fail("unknown_dream");
  if (!Number.isInteger(qty) || qty < 0) return fail("bad_qty");

  const others = cart.filter((line) => line.slug !== dream.slug);
  if (qty === 0) return ok(others);

  if (qty > stock[dream.slug]) return fail("not_enough_stock", { available: stock[dream.slug] });
  if (qty > MAX_QTY_PER_DREAM) return fail("qty_limit", { max: MAX_QTY_PER_DREAM });

  const conflict = nightConflict(others, dream.slug, night);
  if (conflict) return fail("night_conflict", { reason: conflict });

  return ok([...others, { slug: dream.slug, qty, night }]);
}

/** Adds qty on top of what is already in the cart, keeping the night unless a new one is given. */
export function addToCart(cart: Cart, stock: Stock, slug: string, qty: number, night: Night): Result<Cart, CartError> {
  const current = cart.find((line) => line.slug === slug);
  if (!Number.isInteger(qty) || qty < 1) return fail("bad_qty");
  return setLine(cart, stock, slug, (current?.qty ?? 0) + qty, current?.night ?? night);
}

function nightConflict(others: Cart, slug: DreamSlug, night: Night): NightConflict | null {
  const sameNight = others.filter((line) => line.night === night);
  if (sameNight.length === 0) return null;

  const dreams = [...sameNight.map((line) => findDream(line.slug)!), findDream(slug)!];
  if (dreams.some((dream) => dream.wholeNight)) return "whole_night_dream";
  if (dreams.length > MAX_DREAMS_PER_NIGHT) return "too_many_dreams";
  if (dreams.reduce((total, dream) => total + dream.minutes, 0) > MAX_MINUTES_PER_NIGHT) return "too_long";
  return null;
}

export function cartTotal(cart: Cart): Cents {
  return sum(cart.map((line) => multiply(findDream(line.slug)!.price, line.qty)));
}

/** Cart as the assistant and the API see it: names and prices already formatted. */
export function describeCart(cart: Cart) {
  return {
    items: cart.map((line) => {
      const dream = findDream(line.slug)!;
      return { slug: line.slug, name: dream.name.ru, qty: line.qty, night: line.night, price: formatUsd(dream.price) };
    }),
    total: formatUsd(cartTotal(cart)),
  };
}
