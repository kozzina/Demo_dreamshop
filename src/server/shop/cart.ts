import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { addToCart as addLine, describeCart, setLine, type Cart, type CartError, type Stock } from "@/domain/cart";
import { CATALOG, type DreamSlug } from "@/domain/catalog";
import { isBookableNight, today } from "@/domain/nights";
import { fail, ok, type Result } from "@/domain/result";
import { db, type Db, type Tx } from "../db/client";
import { cartLines, orderItems, orders } from "../db/schema";

type Executor = Db | Tx;

/**
 * Each buyer has their own stock: the catalogue stock minus what this session has ordered
 * (cancelled orders give it back). Nobody can buy out a dream for other visitors.
 */
export async function sessionStock(sessionId: string, x: Executor = db()): Promise<Stock> {
  const ordered = await x
    .select({ slug: orderItems.slug, qty: sql<number>`sum(${orderItems.qty})::int` })
    .from(orderItems)
    .innerJoin(orders, eq(orders.number, orderItems.orderNumber))
    .where(and(eq(orders.sessionId, sessionId), ne(orders.status, "cancelled")))
    .groupBy(orderItems.slug);
  const used = new Map(ordered.map((row) => [row.slug, row.qty]));
  return Object.fromEntries(CATALOG.map((dream) => [dream.slug, Math.max(0, dream.stock - (used.get(dream.slug) ?? 0))])) as Stock;
}

export async function loadCart(sessionId: string, x: Executor = db()): Promise<Cart> {
  const rows = await x.select().from(cartLines).where(eq(cartLines.sessionId, sessionId));
  return rows.map((row) => ({ slug: row.slug as DreamSlug, qty: row.qty, night: row.night }));
}

async function saveCart(sessionId: string, cart: Cart, x: Executor): Promise<void> {
  await x.delete(cartLines).where(eq(cartLines.sessionId, sessionId));
  if (cart.length) await x.insert(cartLines).values(cart.map((line) => ({ sessionId, ...line })));
}

export type CartChangeError = CartError | "bad_night";

/** Read the cart, apply one domain operation, save — in one transaction, so parallel taps do not lose an update. */
async function change(sessionId: string, night: string | undefined, apply: (cart: Cart, stock: Stock) => Result<Cart, CartError>) {
  if (night !== undefined && !isBookableNight(night)) return fail("bad_night" as const);
  return db().transaction(async (tx) => {
    const [cart, stock] = await Promise.all([loadCart(sessionId, tx), sessionStock(sessionId, tx)]);
    const result = apply(cart, stock);
    if (!result.ok) return result;
    await saveCart(sessionId, result.value, tx);
    return ok(describeCart(result.value));
  });
}

export const addToCart = (sessionId: string, slug: string, qty: number, night?: string) =>
  change(sessionId, night, (cart, stock) => addLine(cart, stock, slug, qty, night ?? today()));

/** Sets quantity and night of one dream; qty 0 removes it. Keeps the current night if none is given. */
export const updateCartLine = (sessionId: string, slug: string, qty: number, night?: string) =>
  change(sessionId, night, (cart, stock) => setLine(cart, stock, slug, qty, night ?? cart.find((l) => l.slug === slug)?.night ?? today()));

export async function clearCart(sessionId: string) {
  await db().delete(cartLines).where(eq(cartLines.sessionId, sessionId));
  return describeCart([]);
}

export async function getCart(sessionId: string) {
  return describeCart(await loadCart(sessionId));
}
