import "server-only";
import { config } from "../config";

/** Minimal Telegram Bot API client: only the methods the shop uses, typed by hand. */

export type InlineButton = { text: string; web_app: { url: string } } | { text: string; callback_data: string };

interface Methods {
  sendMessage: { chat_id: number; text: string; reply_markup?: { inline_keyboard: InlineButton[][] } };
  sendChatAction: { chat_id: number; action: "typing" };
  answerCallbackQuery: { callback_query_id: string };
}

export class BotApiError extends Error {}

export async function callBot<M extends keyof Methods>(method: M, params: Methods[M]): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${config.telegram.botToken()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    // The token is part of the URL: never log the URL, only the method and Telegram's description.
    const body = (await res.json().catch(() => ({}))) as { description?: string };
    throw new BotApiError(`${method} failed: ${res.status} ${body.description ?? ""}`.trim());
  }
}

export const sendMessage = (chatId: number, text: string, keyboard?: InlineButton[][]) =>
  callBot("sendMessage", { chat_id: chatId, text, ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}) });
