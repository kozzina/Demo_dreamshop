import { z } from "zod";
import { isCertificateAmount } from "@/domain/certificates";
import { error, fromResult, isResponse, parseBody, requireSession } from "@/server/http";
import { requestCertificate } from "@/server/shop/certificates";

const Body = z.object({ amountCents: z.number().int() });

/** Asks a manager for a gift certificate of one of the fixed face values. */
export async function POST(req: Request) {
  const session = await requireSession(req);
  if (isResponse(session)) return session;
  const body = await parseBody(req, Body);
  if (isResponse(body)) return body;
  if (!isCertificateAmount(body.amountCents)) return error("bad_amount", 400);
  return fromResult(await requestCertificate(session, body.amountCents), 201);
}
