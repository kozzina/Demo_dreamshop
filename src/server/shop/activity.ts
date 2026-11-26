import "server-only";
import { inArray, sql } from "drizzle-orm";
import { activityDue, planActivity } from "@/domain/activity";
import { cleanSummary } from "@/domain/manager-request";
import { today } from "@/domain/nights";
import { db } from "../db/client";
import { events } from "../db/schema";
import { recordOrder } from "./orders";

/** One lock id for the whole app: only one request at a time decides whether the shop acts. */
const ACTIVITY_LOCK = 4_242_017;

/**
 * Runs lazily whenever the manager feed is read, like the automatic status moves: no scheduler.
 * After 4–5 quiet minutes another (fictional, numbered) buyer orders or asks for a manager.
 * Background orders belong to no session, so they never touch a visitor's stock or orders,
 * and they move through the statuses by themselves like any untouched order.
 */
export async function maybeAddActivity(now = new Date()): Promise<void> {
  // Cheap check without the lock first: almost every poll ends here.
  if (!activityDue(await quietSeconds(db(), now), 0)) return;
  await db().transaction(async (tx) => {
    // Parallel feed polls wait here; the second one then sees the fresh event and does nothing.
    await tx.execute(sql`select pg_advisory_xact_lock(${ACTIVITY_LOCK})`);
    const [last] = await tx.select({ id: sql<number>`coalesce(max(${events.id}), 0)::int` }).from(events);
    if (!activityDue(await quietSeconds(tx, now), last.id)) return;

    const activity = planActivity(last.id + now.getUTCHours(), today(now));
    const [{ alias }] = (await tx.execute(sql`select 'Покупатель ' || nextval('buyer_number_seq') as alias`)).rows as { alias: string }[];

    if (activity.kind === "order") {
      await recordOrder(tx, { sessionId: null, channel: activity.channel, alias, telegramChatId: null }, activity.lines);
    } else {
      await tx.insert(events).values({ type: "manager_called", payload: { alias, topic: activity.topic, reason: cleanSummary(activity.summary) } });
    }
  });
}

/**
 * Seconds since the last order or call for a manager. Status moves do not count: they follow
 * every order for a minute or two and would push the next event further away.
 */
async function quietSeconds(x: Pick<ReturnType<typeof db>, "select">, now: Date): Promise<number> {
  const [row] = await x
    .select({ at: sql<string | null>`max(${events.createdAt})` })
    .from(events)
    .where(inArray(events.type, ["order_created", "manager_called"]));
  return row.at ? (now.getTime() - new Date(row.at).getTime()) / 1000 : Infinity;
}
