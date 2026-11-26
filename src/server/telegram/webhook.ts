import "server-only";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { config } from "../config";
import { telegramSession } from "../shop/sessions";
import { callBot, sendMessage, type InlineButton } from "./bot-api";
import { ASSISTANT_SOON, GREETING, OPEN_SHOP_BUTTON } from "./messages";

/** Only the fields the shop reads; everything else in an update is ignored. */
const Update = z.object({
  message: z
    .object({
      chat: z.object({ id: z.number(), type: z.string() }),
      from: z.object({ language_code: z.string().optional() }).optional(),
      text: z.string().optional(),
    })
    .optional(),
});

/** Telegram echoes the secret set in setWebhook; anything without it is not from Telegram. */
export function isFromTelegram(header: string | null): boolean {
  const expected = Buffer.from(config.telegram.webhookSecret());
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const shopKeyboard = (): InlineButton[][] => [[{ text: OPEN_SHOP_BUTTON, web_app: { url: `${config.appUrl()}/app` } }]];

/** Handles one update. Group chats are ignored: the shop works in a private chat only. */
export async function handleUpdate(body: unknown): Promise<void> {
  const update = Update.safeParse(body);
  const message = update.success ? update.data.message : undefined;
  if (!message || message.chat.type !== "private" || !message.text) return;

  const chatId = message.chat.id;
  const lang = message.from?.language_code?.startsWith("ru") === false ? "en" : "ru";
  await telegramSession(chatId, lang);

  if (message.text.startsWith("/start")) {
    await sendMessage(chatId, GREETING, shopKeyboard());
    return;
  }
  await callBot("sendChatAction", { chat_id: chatId, action: "typing" });
  await sendMessage(chatId, ASSISTANT_SOON, shopKeyboard());
}
