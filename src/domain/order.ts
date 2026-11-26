import { fail, ok, type Result } from "./result";

/** KNOWLEDGE.md, section 4. A status only moves forward; cancellation goes through a manager. */
export const ORDER_STATUSES = ["new", "accepted", "assembling", "delivering", "delivered"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number] | "cancelled";

export type StatusError = "already_final" | "not_next";

/** Next status in the pipeline, or null for a finished or cancelled order. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === "cancelled") return null;
  const index = ORDER_STATUSES.indexOf(status);
  return ORDER_STATUSES[index + 1] ?? null;
}

/**
 * Moves an order to `target`, only one step forward.
 * The manager feed is shared by all visitors, so a status can never go back or skip steps.
 */
export function advance(current: OrderStatus, target: OrderStatus): Result<OrderStatus, StatusError> {
  const next = nextStatus(current);
  if (next === null) return fail("already_final");
  if (target !== next) return fail("not_next", { expected: next });
  return ok(next);
}

/** Free cancellation while the workshop has not started (KNOWLEDGE.md, section 5). */
export const isFreeToCancel = (status: OrderStatus): boolean => status === "new" || status === "accepted";
