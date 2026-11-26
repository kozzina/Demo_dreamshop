import "server-only";
import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { askAssistant } from "../assistant/run";
import { config } from "../config";
import { telegramSession, type Session } from "../shop/sessions";
import { callBot, sendMessage, type InlineButton } from "./bot-api";
import { GREETING, OPEN_CART_BUTTON, OPEN_SHOP_BUTTON } from "./messages";

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

/** Telegram shows «печатает…» for about five seconds; renew it while Sonya is thinking. */
const TYPING_EVERY_MS = 4500;

/** Telegram echoes the secret set in setWebhook; anything without it is not from Telegram. */
export function isFromTelegram(header: string | null): boolean {
  const expected = Buffer.from(config.telegram.webhookSecret());
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const webAppButton = (text: string, path: string): InlineButton[][] => [[{ text, web_app: { url: `${config.appUrl()}${path}` } }]];

const typing = (chatId: number) => callBot("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {});

/** Sonya answers in the chat: «печатает…» while the model works, then one or two messages. */
async function replyInChat(session: Session, chatId: number, text: string): Promise<void> {
  await typing(chatId);
  const timer = setInterval(() => typing(chatId), TYPING_EVERY_MS);
  try {
    const reply = await askAssistant(session, text);
    for (const [i, message] of reply.messages.entries()) {
      const last = i === reply.messages.length - 1;
      const keyboard = !last ? undefined : reply.changed ? webAppButton(OPEN_CART_BUTTON, "/app/cart") : reply.fallback ? webAppButton(OPEN_SHOP_BUTTON, "/app") : undefined;
      await sendMessage(chatId, message, keyboard);
    }
  } finally {
    clearInterval(timer);
  }
}

/**
 * Handles one update. Group chats are ignored: the shop works in a private chat only.
 * The answer is sent after the webhook has replied, so Telegram never waits for the model
 * and never resends the update.
 */
export async function handleUpdate(body: unknown): Promise<void> {
  const update = Update.safeParse(body);
  const message = update.success ? update.data.message : undefined;
  if (!message || message.chat.type !== "private" || !message.text) return;

  const chatId = message.chat.id;
  const lang = message.from?.language_code?.startsWith("ru") === false ? "en" : "ru";
  const session = await telegramSession(chatId, lang);

  if (message.text.startsWith("/start")) {
    await sendMessage(chatId, GREETING, webAppButton(OPEN_SHOP_BUTTON, "/app"));
    return;
  }
  const text = message.text;
  after(() => replyInChat(session, chatId, text).catch((err) => console.error("[telegram assistant]", err)));
}
