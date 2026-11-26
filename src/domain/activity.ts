import { nightConflict, type Cart } from "./cart";
import { CATALOG, type DreamSlug } from "./catalog";
import type { ManagerTopic } from "./manager-request";
import { addDays } from "./nights";

/**
 * The shop's own background activity in the shared manager feed: while someone watches the feed,
 * every 4–5 minutes another buyer places an order or asks for a manager, so the demo looks
 * lived-in. Decided by Karina: these are the same fictional demo data as the dreams and buyers.
 * Pure and seeded, so it is testable and two servers pick the same event for the same seed.
 */

/** A new event after 240–300 s of quiet; the exact pause depends on the seed. */
export const ACTIVITY_MIN_SECONDS = 240;
const ACTIVITY_SPREAD_SECONDS = 60;

export const activityDue = (quietSeconds: number, seed: number): boolean =>
  quietSeconds >= ACTIVITY_MIN_SECONDS + (Math.abs(seed) % (ACTIVITY_SPREAD_SECONDS + 1));

export type Activity =
  | { kind: "order"; channel: "web" | "telegram"; lines: Cart }
  | { kind: "request"; topic: ManagerTopic; summary: string };

/**
 * Only what a person has to do (knowledge base, sections 5–7): questions the knowledge base
 * answers are Sonya's, so they never show up here as calls for a manager.
 */
const REQUESTS: { topic: ManagerTopic; summary: string }[] = [
  { topic: "certificate", summary: "Подарочный сертификат на $25" },
  { topic: "certificate", summary: "Подарочный сертификат на $50" },
  { topic: "reschedule", summary: "Хочет перенести ночь заказа на выходные" },
  { topic: "cancel", summary: "Хочет отменить заказ: планы на эту ночь поменялись" },
  { topic: "complaint", summary: "Сон прервался посреди ночи, просит перенести его на другую ночь" },
  { topic: "other", summary: "Хочет заказать 20 снов для команды — больше лимита в одном заказе" },
];

/** Dreams the shop sells right now (the sold-out seasonal one never shows up in orders). */
const ON_SALE = CATALOG.filter((dream) => dream.stock > 0).map((dream) => dream.slug);

/** Small deterministic generator (mulberry32). */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Four orders for every request, one or two dreams, a night within the next three days. */
export function planActivity(seed: number, today: string): Activity {
  const next = random(seed);
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)];

  if (next() < 0.2) return { kind: "request", ...pick(REQUESTS) };

  const night = addDays(today, Math.floor(next() * 4));
  const lines: { slug: DreamSlug; qty: number; night: string }[] = [{ slug: pick(ON_SALE), qty: next() < 0.85 ? 1 : 2, night }];
  if (next() < 0.35) {
    const second = pick(ON_SALE);
    if (second !== lines[0].slug && !nightConflict(lines, second, night)) lines.push({ slug: second, qty: 1, night });
  }
  return { kind: "order", channel: next() < 0.6 ? "telegram" : "web", lines };
}
