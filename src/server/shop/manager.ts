import "server-only";
import { gte, sql } from "drizzle-orm";
import { cents, formatUsd } from "@/domain/money";
import { db } from "../db/client";
import { orders } from "../db/schema";
import type { ManagerStats } from "@/shared/contract";

/** «Сегодня: 12 заказов на $96.40» in the manager chat header: all buyers, since midnight UTC. */
export async function managerStats(now = new Date()): Promise<ManagerStats> {
  const midnight = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z");
  const [row] = await db()
    .select({ count: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int` })
    .from(orders)
    .where(gte(orders.createdAt, midnight));
  return { ordersToday: row.count, totalToday: formatUsd(cents(row.total)) };
}
