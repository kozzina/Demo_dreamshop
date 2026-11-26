import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { findSession, type Session } from "./shop/sessions";

/**
 * One response shape for the whole API:
 *   success → the data itself;  error → { error: "code", details? } with a fitting status.
 */
export const json = <T>(data: T, status = 200) => NextResponse.json(data, { status });

export const error = (code: string, status: number, details?: unknown) =>
  NextResponse.json(details === undefined ? { error: code } : { error: code, details }, { status });

const INPUT_ERRORS = new Set(["bad_night", "bad_qty", "unknown_dream"]);

/** Business conflicts (out of stock, night conflict…) are 409, bad input is 400, a missing order 404. */
export const fromResult = <T>(result: { ok: true; value: T } | { ok: false; error: string; details?: unknown }, okStatus = 200) =>
  result.ok
    ? json(result.value, okStatus)
    : error(result.error, result.error === "not_found" ? 404 : INPUT_ERRORS.has(result.error) ? 400 : 409, result.details);

export const SESSION_HEADER = "x-session-id";

/** The buyer's session from the request header, or a 401 response to return as is. */
export async function requireSession(req: Request): Promise<Session | NextResponse> {
  const session = await findSession(req.headers.get(SESSION_HEADER));
  return session ?? error("no_session", 401);
}

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S> | NextResponse> {
  const body = await req.json().catch(() => undefined);
  const parsed = schema.safeParse(body);
  return parsed.success ? parsed.data : error("bad_request", 400, parsed.error.issues.map((i) => i.message));
}

export const isResponse = (value: unknown): value is NextResponse => value instanceof NextResponse;
