import { z } from "zod";
import { fromResult, isResponse, json, parseBody, requireSession } from "@/server/http";
import { addToCart, clearCart, getCart, updateCartLine } from "@/server/shop/cart";

const Line = z.object({
  slug: z.string().min(1),
  qty: z.number().int().min(0).max(99),
  night: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  return json(await getCart(session.id));
}

/** Adds qty of a dream on top of what is already in the cart. */
export async function POST(req: Request) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  const body = await parseBody(req, Line.extend({ qty: z.number().int().min(1).max(99) }));
  if (isResponse(body)) return body;
  return fromResult(await addToCart(session.id, body.slug, body.qty, body.night));
}

/** Sets qty and/or night of one dream; qty 0 removes it. */
export async function PATCH(req: Request) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  const body = await parseBody(req, Line);
  if (isResponse(body)) return body;
  return fromResult(await updateCartLine(session.id, body.slug, body.qty, body.night));
}

export async function DELETE(req: Request) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  return json(await clearCart(session.id));
}
