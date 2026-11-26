import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { chatMessages } from "../db/schema";
import type { ChatLine } from "@/shared/contract";

const VISIBLE_LINES = 40;

/**
 * The chat as the buyer sees it: their own texts and Sonya's text answers.
 * Tool calls and tool results stay on the server.
 */
export async function chatHistory(sessionId: string): Promise<ChatLine[]> {
  const rows = await db().select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(desc(chatMessages.id)).limit(VISIBLE_LINES * 3);
  const lines: ChatLine[] = [];
  for (const row of rows.reverse()) {
    if (row.role === "user" && typeof row.content === "string") lines.push({ role: "buyer", text: row.content });
    if (row.role === "assistant") {
      const blocks = typeof row.content === "string" ? [{ type: "text", text: row.content }] : (row.content as { type: string; text?: string }[]);
      const text = blocks.flatMap((b) => (b.type === "text" && b.text ? [b.text] : [])).join("\n").trim();
      if (text) lines.push({ role: "assistant", text });
    }
  }
  return lines.slice(-VISIBLE_LINES);
}
