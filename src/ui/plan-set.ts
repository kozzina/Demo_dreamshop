import { nightConflict, type Cart } from "@/domain/cart";
import type { DreamSlug } from "@/domain/catalog";

/**
 * Picks the first run of consecutive nights where every dream of a set fits next to what is
 * already in the cart. A dream already in the cart stays on its night (the server keeps it there).
 * Returns the night for each dream, or null if no run fits. The server re-checks every add.
 */
export function planSet(cart: Cart, dreams: readonly DreamSlug[], nights: readonly string[]): string[] | null {
  for (let start = 0; start + dreams.length <= nights.length; start++) {
    const planned: { slug: DreamSlug; qty: number; night: string }[] = [...cart];
    const result: string[] = [];
    const fits = dreams.every((slug, i) => {
      const existing = planned.find((line) => line.slug === slug);
      if (existing) return result.push(existing.night);
      const night = nights[start + i];
      if (nightConflict(planned, slug, night)) return false;
      planned.push({ slug, qty: 1, night });
      return result.push(night);
    });
    if (fits) return result;
  }
  return null;
}
