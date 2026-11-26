import { z } from "zod";
import { ORDER_STATUSES } from "@/domain/order";
import { error, fromResult, isResponse, parseBody } from "@/server/http";
import { advanceOrder } from "@/server/shop/orders";

const Body = z.object({ status: z.enum(ORDER_STATUSES) });

/**
 * A button in the shared manager feed. Open to every visitor on purpose:
 * a status only moves one step forward, so nothing can be broken.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/orders/[number]/advance">) {
  const number = Number((await ctx.params).number);
  if (!Number.isInteger(number)) return error("bad_request", 400);
  const body = await parseBody(req, Body);
  if (isResponse(body)) return body;
  const result = await advanceOrder(number, body.status, "manager");
  return fromResult(result.ok ? { ok: true as const, value: { number, status: result.value.status } } : result);
}
