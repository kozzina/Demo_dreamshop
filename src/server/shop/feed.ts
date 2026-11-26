import "server-only";
import { desc, eq, gt } from "drizzle-orm";
import { db } from "../db/client";
import { events, orders } from "../db/schema";
import { advanceStaleOrders } from "./orders";
import type { FeedEvent } from "@/shared/contract";

export const FEED_SIZE = 50;


/**
 * The shared manager feed: the latest events of all buyers, newest first.
 * `afterId` lets the phone on the site poll for new events only.
 */
export async function listFeed(viewerSessionId: string | null, afterId = 0): Promise<FeedEvent[]> {
  await advanceStaleOrders();
  const rows = await db()
    .select({ event: events, orderStatus: orders.status, sessionId: orders.sessionId })
    .from(events)
    .leftJoin(orders, eq(orders.number, events.orderNumber))
    .where(gt(events.id, afterId))
    .orderBy(desc(events.id))
    .limit(FEED_SIZE);
  return rows.map(({ event, orderStatus, sessionId }) => ({
    id: event.id,
    type: event.type,
    orderNumber: event.orderNumber,
    orderStatus,
    mine: viewerSessionId !== null && sessionId === viewerSessionId,
    payload: (event.payload ?? {}) as Record<string, unknown>,
    createdAt: event.createdAt.toISOString(),
  }));
}
