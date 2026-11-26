import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
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
  /** Set for Telegram buyers: where the bot sends their order updates. */
  telegramChatId: number | null;
}

type SessionRow = typeof sessions.$inferSelect;
const toSession = (row: SessionRow): Session => ({
  id: row.id,
  channel: row.channel,
  alias: row.alias,
  lang: row.lang,
  telegramChatId: row.telegramChatId,
});

export async function createSession(channel: Channel, lang: Lang, telegramChatId: number | null = null): Promise<Session> {
  const alias = `Покупатель ${ALIASES[Math.floor(Math.random() * ALIASES.length)]}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600_000);
  const [row] = await db().insert(sessions).values({ channel, lang, alias, telegramChatId, expiresAt }).returning();
  return toSession(row);
}

/**
 * One sandbox per Telegram chat: the bot chat and the mini app find the same session,
 * so what the assistant puts in the cart shows up in the mini app and the other way round.
 */
export async function telegramSession(chatId: number, lang: Lang): Promise<Session> {
  const [row] = await db()
    .select()
    .from(sessions)
    .where(and(eq(sessions.telegramChatId, chatId), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.expiresAt))
    .limit(1);
  return row ? toSession(row) : createSession("telegram", lang, chatId);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The session id works as a bearer token: random 122 bits, so it cannot be guessed. */
export async function findSession(id: string | null): Promise<Session | null> {
  if (!id || !UUID.test(id)) return null;
  const [row] = await db().select().from(sessions).where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date()))).limit(1);
  return row ? toSession(row) : null;
}
