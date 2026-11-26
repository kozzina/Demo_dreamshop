import { error, json } from "@/server/http";
import { handleUpdate, isFromTelegram } from "@/server/telegram/webhook";

/**
 * Telegram webhook. Always answers 200 once the secret matches: a non-200 makes Telegram
 * resend the same update again and again, so failures are logged instead.
 */
export async function POST(req: Request) {
  if (!isFromTelegram(req.headers.get("x-telegram-bot-api-secret-token"))) return error("forbidden", 403);
  try {
    await handleUpdate(await req.json());
  } catch (err) {
    console.error("[telegram webhook]", err);
  }
  return json({ ok: true });
}
