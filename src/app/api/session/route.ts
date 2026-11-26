import { z } from "zod";
import { config } from "@/server/config";
import { error, isResponse, json, parseBody } from "@/server/http";
import { createSession, telegramSession } from "@/server/shop/sessions";
import { verifyInitData } from "@/server/telegram/init-data";

const Body = z.object({
  lang: z.enum(["ru", "en"]).default("ru"),
  /** Telegram.WebApp.initData when the shop runs inside Telegram. */
  initData: z.string().max(4096).optional(),
});

/**
 * The buyer's sandbox. On the site: a new web session. Inside Telegram: the session of this chat,
 * found or created from the signed launch data, so it is shared with the bot chat.
 */
export async function POST(req: Request) {
  const body = await parseBody(req, Body);
  if (isResponse(body)) return body;

  if (body.initData) {
    const buyer = verifyInitData(body.initData, config.telegram.botToken());
    if (!buyer.ok) return error(buyer.error, 401);
    const session = await telegramSession(buyer.value.chatId, buyer.value.lang);
    return json({ id: session.id, alias: session.alias });
  }

  const session = await createSession("web", body.lang);
  return json({ id: session.id, alias: session.alias }, 201);
}
