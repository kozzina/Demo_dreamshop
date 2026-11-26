import "server-only";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { cartTotal, describeCart } from "@/domain/cart";
import { findDream } from "@/domain/catalog";
import { cents, formatUsd } from "@/domain/money";
import { advance, nextStatus, type OrderStatus } from "@/domain/order";
import { fail, ok } from "@/domain/result";
import { db } from "../db/client";
import { cartLines, events, orderItems, orders } from "../db/schema";
import { loadCart, sessionStock } from "./cart";
import type { Session } from "./sessions";

/** If nobody presses a button in the manager feed, an order moves on by itself after this delay. */
export const AUTO_ADVANCE_SECONDS = 20;
const LOW_STOCK = 2;

export interface OrderView {
  number: number;
  status: OrderStatus;
  total: string;
  items: { slug: string; name: string; qty: number; night: string; price: string }[];
  createdAt: string;
}

/**
 * Places the order in one transaction: re-checks stock, writes the order and its items,
 * posts feed events and empties the cart. Either all of it happens or nothing.
 */
export async function placeOrder(session: Session, telegramChatId?: number) {
  return db().transaction(async (tx) => {
    const cart = await loadCart(session.id, tx);
    if (cart.length === 0) return fail("cart_empty" as const);

    const stock = await sessionStock(session.id, tx);
    const short = cart.find((line) => line.qty > stock[line.slug]);
    if (short) return fail("not_enough_stock" as const, { slug: short.slug, available: stock[short.slug] });

    const total = cartTotal(cart);
    const [order] = await tx
      .insert(orders)
      .values({ sessionId: session.id, channel: session.channel, alias: session.alias, telegramChatId, totalCents: total })
      .returning();
    await tx.insert(orderItems).values(
      cart.map((line) => ({ orderNumber: order.number, slug: line.slug, qty: line.qty, night: line.night, priceCents: findDream(line.slug)!.price })),
    );

    const view = describeCart(cart);
    await tx.insert(events).values([
      { orderNumber: order.number, type: "order_created", payload: { alias: session.alias, items: view.items, total: view.total } },
      { orderNumber: order.number, type: "payment_passed", payload: { total: view.total } },
      ...cart
        .filter((line) => stock[line.slug] - line.qty <= LOW_STOCK)
        .map((line) => ({ type: "low_stock" as const, payload: { slug: line.slug, name: findDream(line.slug)!.name.ru, left: stock[line.slug] - line.qty } })),
    ]);
    await tx.delete(cartLines).where(eq(cartLines.sessionId, session.id));

    return ok({ number: order.number, status: order.status, total: formatUsd(total), items: view.items, createdAt: order.createdAt.toISOString() } satisfies OrderView);
  });
}

async function viewsOf(rows: (typeof orders.$inferSelect)[]): Promise<OrderView[]> {
  if (rows.length === 0) return [];
  const items = await db().select().from(orderItems).where(inArray(orderItems.orderNumber, rows.map((r) => r.number)));
  return rows.map((row) => ({
    number: row.number,
    status: row.status,
    total: formatUsd(cents(row.totalCents)),
    createdAt: row.createdAt.toISOString(),
    items: items
      .filter((item) => item.orderNumber === row.number)
      .map((item) => ({ slug: item.slug, name: findDream(item.slug)?.name.ru ?? item.slug, qty: item.qty, night: item.night, price: formatUsd(cents(item.priceCents)) })),
  }));
}

export async function listOrders(sessionId: string): Promise<OrderView[]> {
  await advanceStaleOrders();
  return viewsOf(await db().select().from(orders).where(eq(orders.sessionId, sessionId)).orderBy(desc(orders.number)));
}

/** A buyer only ever sees their own orders: someone else's number answers "not found". */
export async function getOrder(sessionId: string, number: number): Promise<OrderView | null> {
  await advanceStaleOrders();
  const rows = await db().select().from(orders).where(and(eq(orders.sessionId, sessionId), eq(orders.number, number)));
  return (await viewsOf(rows))[0] ?? null;
}

/**
 * Moves an order one step forward. Anyone can press the button in the shared manager feed,
 * so the domain rule (forward only, no skipping) is checked under a row lock.
 */
export async function advanceOrder(number: number, target: OrderStatus, by: "manager" | "auto") {
  return db().transaction(async (tx) => {
    const [row] = await tx.select().from(orders).where(eq(orders.number, number)).for("update");
    if (!row) return fail("not_found" as const);
    const result = advance(row.status, target);
    if (!result.ok) return result;
    await tx.update(orders).set({ status: result.value, statusChangedAt: new Date() }).where(eq(orders.number, number));
    await tx.insert(events).values({ orderNumber: number, type: "status_changed", payload: { from: row.status, to: result.value, by } });
    return ok({ number, status: result.value, telegramChatId: row.telegramChatId });
  });
}

/**
 * Orders nobody touched for a while move on by themselves. Run lazily whenever the feed or
 * an order is read, so the demo needs no scheduler; each order moves at most one step per call.
 */
export async function advanceStaleOrders(): Promise<void> {
  const cutoff = new Date(Date.now() - AUTO_ADVANCE_SECONDS * 1000);
  const stale = await db()
    .select({ number: orders.number, status: orders.status })
    .from(orders)
    .where(and(lt(orders.statusChangedAt, cutoff), sql`${orders.status} not in ('delivered', 'cancelled')`))
    .limit(20);
  for (const order of stale) {
    const next = nextStatus(order.status);
    if (next) await advanceOrder(order.number, next, "auto");
  }
}

/** The assistant or the buyer asks for a human: a feed event the manager sees. */
export async function callManager(session: Session, reason: string, orderNumber?: number) {
  await db().insert(events).values({ orderNumber: orderNumber ?? null, type: "manager_called", payload: { alias: session.alias, reason: reason.slice(0, 300) } });
  return ok({ called: true });
}
