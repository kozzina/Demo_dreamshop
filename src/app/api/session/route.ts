import { z } from "zod";
import { isResponse, json, parseBody } from "@/server/http";
import { createSession } from "@/server/shop/sessions";

const Body = z.object({ lang: z.enum(["ru", "en"]).default("ru") });

/** A new web sandbox. Telegram sessions are created from signed mini app data. */
export async function POST(req: Request) {
  const body = await parseBody(req, Body);
  if (isResponse(body)) return body;
  const session = await createSession("web", body.lang);
  return json({ id: session.id, alias: session.alias }, 201);
}
