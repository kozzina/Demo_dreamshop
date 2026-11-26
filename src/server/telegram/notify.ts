import "server-only";
import { inArray } from "drizzle-orm";
import { after } from "next/server";
import { findDream } from "@/domain/catalog";
import type { OrderStatus } from "@/domain/order";
import { db } from "../db/client";
import { orderItems } from "../db/schema";
import { sendMessage } from "./bot-api";
import { orderNotice } from "./messages";

export interface OrderChange {
  number: number;
  status: OrderStatus;
  total: string;
  telegramChatId: number | null;
}

/**
 * Tells Telegram buyers about their orders. Runs after the response is sent (`after`), so a slow
 * or failing Telegram never delays the shop or the manager feed; failures are only logged.
 */
export function notifyBuyers(changes: OrderChange[]): void {
  const toTelegram = changes.filter((change) => change.telegramChatId !== null);
  if (toTelegram.length === 0) return;
  after(async () => {
    const items = await db()
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderNumber, toTelegram.map((change) => change.number)));
    await Promise.all(
      toTelegram.map(async (change) => {
        const text = orderNotice({
          ...change,
          items: items
            .filter((item) => item.orderNumber === change.number)
            .map((item) => ({ name: findDream(item.slug)?.name.ru ?? item.slug, night: item.night })),
        });
        if (!text) return;
        await sendMessage(change.telegramChatId!, text).catch((err: unknown) => console.error("[notify]", change.number, err));
      }),
    );
  });
}
