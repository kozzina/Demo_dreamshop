import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { fail, ok, type Result } from "@/domain/result";

/** Signed launch data older than this is refused, so a leaked string does not work forever. */
export const INIT_DATA_MAX_AGE_SECONDS = 24 * 3600;

export interface TelegramBuyer {
  /** In a private chat with the bot the chat id equals the user id. */
  chatId: number;
  lang: "ru" | "en";
}

type InitDataError = "bad_signature" | "expired" | "no_user";

/**
 * Checks the data Telegram passes to the mini app (Telegram.WebApp.initData).
 * Algorithm from core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app:
 * secret = HMAC-SHA256("WebAppData", bot token); hash = HMAC-SHA256(secret, sorted "key=value" lines).
 * Only the user id and language are taken; names and usernames are ignored and never stored.
 */
export function verifyInitData(raw: string, botToken: string, now = new Date()): Result<TelegramBuyer, InitDataError> {
  const params = new URLSearchParams(raw);
  const hash = params.get("hash");
  if (!hash) return fail("bad_signature");
  params.delete("hash");

  const checkString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(checkString).digest();
  const given = Buffer.from(hash, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return fail("bad_signature");

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || now.getTime() / 1000 - authDate > INIT_DATA_MAX_AGE_SECONDS) return fail("expired");

  const user = parseUser(params.get("user"));
  if (!user) return fail("no_user");
  return ok({ chatId: user.id, lang: user.language_code?.startsWith("ru") === false ? "en" : "ru" });
}

function parseUser(raw: string | null): { id: number; language_code?: string } | null {
  if (!raw) return null;
  try {
    const user: unknown = JSON.parse(raw);
    if (typeof user === "object" && user !== null && "id" in user && Number.isSafeInteger(user.id)) {
      return user as { id: number; language_code?: string };
    }
  } catch {
    // malformed JSON is treated as "no user"
  }
  return null;
}
