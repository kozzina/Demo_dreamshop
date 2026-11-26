import { z } from "zod";
import { chatHistory } from "@/server/assistant/history";
import { askAssistant } from "@/server/assistant/run";
import { isResponse, json, parseBody, requireSession } from "@/server/http";
import type { ChatReply } from "@/shared/contract";

const Body = z.object({ text: z.string().trim().min(1).max(2000) });

/** The chat with Sonya for buyers on the site (in Telegram she answers in the bot chat). */
export async function GET(req: Request) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  return json(await chatHistory(session.id));
}

export async function POST(req: Request) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  const body = await parseBody(req, Body);
  if (isResponse(body)) return body;
  const reply = await askAssistant(session, body.text);
  return json<ChatReply>({ messages: reply.messages, trace: reply.trace, changed: reply.changed });
}
