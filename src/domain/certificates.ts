import { cents, type Cents } from "./money";

/** Gift certificates from content/knowledge.md, section 5: three face values, valid for a year, issued by a manager. */
export const CERTIFICATE_AMOUNTS = [cents(1000), cents(2500), cents(5000)] as const;
export const CERTIFICATE_VALID_MONTHS = 12;

export const isCertificateAmount = (amount: number): amount is Cents => CERTIFICATE_AMOUNTS.some((value) => value === amount);
