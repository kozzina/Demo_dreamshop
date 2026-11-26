/**
 * Money is stored as integer cents: $8.90 + $11.90 must be exactly $20.80,
 * which floating point does not guarantee.
 */
export type Cents = number & { readonly __brand: "Cents" };

export const cents = (value: number): Cents => {
  if (!Number.isInteger(value) || value < 0) throw new Error(`Invalid cents amount: ${value}`);
  return value as Cents;
};

export const sum = (amounts: readonly Cents[]): Cents => cents(amounts.reduce((total, amount) => total + amount, 0));

export const multiply = (amount: Cents, qty: number): Cents => cents(amount * qty);

/** $8.90 — the only currency of the shop is USD. */
export const formatUsd = (amount: Cents): string => `$${(amount / 100).toFixed(2)}`;
