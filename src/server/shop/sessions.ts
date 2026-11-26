import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/client";
import { sessions } from "../db/schema";

export type Channel = "web" | "telegram";
export type Lang = "ru" | "en";

/** Sessions live a day: long enough to try the demo, short enough to keep nothing for long. */
export const SESSION_TTL_HOURS = 24;

/** Fictional buyer names for the shared feed. Real Telegram names are never stored. */
const ALIASES = ["Луна", "Облако", "Звезда", "Ветер", "Сова", "Комета", "Туман", "Рассвет", "Светлячок", "Прибой"];

export interface Session {
  id: string;
  channel: Channel;
  alias: string;
  lang: Lang;
}

export async function createSession(channel: Channel, lang: Lang): Promise<Session> {
  const alias = `Покупатель ${ALIASES[Math.floor(Math.random() * ALIASES.length)]}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600_000);
  const [row] = await db().insert(sessions).values({ channel, lang, alias, expiresAt }).returning();
  return { id: row.id, channel: row.channel, alias: row.alias, lang: row.lang };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The session id works as a bearer token: random 122 bits, so it cannot be guessed. */
export async function findSession(id: string | null): Promise<Session | null> {
  if (!id || !UUID.test(id)) return null;
  const [row] = await db().select().from(sessions).where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date()))).limit(1);
  return row ? { id: row.id, channel: row.channel, alias: row.alias, lang: row.lang } : null;
}
