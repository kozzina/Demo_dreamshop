import { fromResult, isResponse, json, requireSession } from "@/server/http";
import { listOrders, placeOrder } from "@/server/shop/orders";

export async function GET(req: Request) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  return json(await listOrders(session.id));
}

/** Places an order from the cart. Payment is simulated: no money is charged. */
export async function POST(req: Request) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  return fromResult(await placeOrder(session), 201);
}
