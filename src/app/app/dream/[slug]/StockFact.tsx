"use client";

import type { DreamSlug } from "@/domain/catalog";
import { useShop } from "@/ui/shop-context";

/** Live stock of this buyer's sandbox, as one of the facts under the title. */
export function StockFact({ slug }: { slug: DreamSlug }) {
  const { catalog, ready } = useShop();
  const stock = catalog.find((dream) => dream.slug === slug)?.inStock;
  return (
    <div>
      <dt>В наличии</dt>
      <dd>{!ready || stock === undefined ? "…" : stock === 0 ? "нет" : `${stock} шт.`}</dd>
    </div>
  );
}
