import { CATALOG, coverPath } from "@/domain/catalog";
import { formatUsd } from "@/domain/money";
import { json, SESSION_HEADER } from "@/server/http";
import { sessionStock } from "@/server/shop/cart";
import { findSession } from "@/server/shop/sessions";
import type { CatalogItem } from "@/shared/contract";

/** The catalogue with the stock of this buyer's sandbox (or the starting stock without a session). */
export async function GET(req: Request) {
  const session = await findSession(req.headers.get(SESSION_HEADER));
  const stock = session ? await sessionStock(session.id) : null;
  return json<CatalogItem[]>(
    CATALOG.map((dream) => ({
      slug: dream.slug,
      name: dream.name,
      genre: dream.genre,
      minutes: dream.minutes,
      age: dream.age,
      price: formatUsd(dream.price),
      inStock: stock ? stock[dream.slug] : dream.stock,
      wholeNight: dream.wholeNight,
      cover: coverPath(dream.slug),
    })),
  );
}
