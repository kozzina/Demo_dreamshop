/** Result of a domain operation: either a value or a typed, expected error. Exceptions are reserved for bugs. */
export type Result<T, E extends string> = { ok: true; value: T } | { ok: false; error: E; details?: Record<string, unknown> };

export const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });

export const fail = <E extends string>(error: E, details?: Record<string, unknown>): { ok: false; error: E; details?: Record<string, unknown> } =>
  ({ ok: false, error, details });
