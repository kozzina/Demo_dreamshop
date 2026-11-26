import { z } from "zod";
import { ORDER_STATUSES } from "@/domain/order";
import { error, fromResult, isResponse, parseBody } from "@/server/http";
import { advanceOrder } from "@/server/shop/orders";

const Body = z.object({ status: z.enum(ORDER_STATUSES) });

/**
 * A button in the shared manager feed. Any visitor may press it — that is part of the demo —
 * and nothing can be broken: the status only moves one step forward, checked under a row lock.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/manager/orders/[number]">) {
  const number = Number((await ctx.params).number);
  if (!Number.isInteger(number)) return error("bad_request", 400);
  const body = await parseBody(req, Body);
  if (isResponse(body)) return body;
  const result = await advanceOrder(number, body.status, "manager");
  return fromResult(result.ok ? ok(result.value) : result);
}

/** The order's chat id stays on the server. */
const ok = ({ number, status }: { number: number; status: string }) => ({ ok: true as const, value: { number, status } });
