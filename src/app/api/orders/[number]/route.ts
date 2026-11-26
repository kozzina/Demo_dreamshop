import { error, isResponse, json, requireSession } from "@/server/http";
import { getOrder } from "@/server/shop/orders";

export async function GET(req: Request, ctx: RouteContext<"/api/orders/[number]">) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  const number = Number((await ctx.params).number);
  if (!Number.isInteger(number)) return error("bad_request", 400);
  const order = await getOrder(session.id, number);
  return order ? json(order) : error("not_found", 404);
}
