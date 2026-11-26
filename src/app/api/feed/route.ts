import { json, SESSION_HEADER } from "@/server/http";
import { listFeed } from "@/server/shop/feed";
import { findSession } from "@/server/shop/sessions";

/** The shared manager feed; ?after=<id> returns only newer events for polling. */
export async function GET(req: Request) {
  const after = Number(new URL(req.url).searchParams.get("after") ?? 0);
  const session = await findSession(req.headers.get(SESSION_HEADER));
  return json(await listFeed(session?.id ?? null, Number.isInteger(after) && after > 0 ? after : 0));
}
