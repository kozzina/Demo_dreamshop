/**
 * A call for a human in the shared manager feed. Every visitor of the demo sees the feed,
 * so the request carries a fixed topic and a short neutral summary with contacts stripped.
 */
export const MANAGER_TOPICS = ["question", "cancel", "reschedule", "certificate", "complaint", "other"] as const;
export type ManagerTopic = (typeof MANAGER_TOPICS)[number];

export const TOPIC_LABEL: Record<ManagerTopic, string> = {
  question: "вопрос",
  cancel: "отмена заказа",
  reschedule: "перенос ночи",
  certificate: "подарочный сертификат",
  complaint: "претензия",
  other: "другое",
};

/** Longest summary shown in the feed. */
export const SUMMARY_MAX = 160;

const URL = /\b(?:https?:\/\/|www\.)\S+/gi;
const EMAIL = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
/** Seven or more digits, possibly split by spaces, dashes or brackets: phones, cards, documents. */
const LONG_NUMBER = /\+?\d[\d\s()-]{5,}\d/g;
const HANDLE = /(^|\s)@\w{3,}/g;

/**
 * The summary as the feed shows it: no links, e-mails, long numbers or @handles, one line,
 * cut to SUMMARY_MAX on a word boundary. Order numbers (4 digits) stay.
 */
export function cleanSummary(text: string): string {
  const clean = text
    .replace(URL, "[ссылка]")
    .replace(EMAIL, "[почта]")
    .replace(LONG_NUMBER, "[номер]")
    .replace(HANDLE, "$1[контакт]")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= SUMMARY_MAX) return clean;
  const cut = clean.slice(0, SUMMARY_MAX - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length).trim()}…`;
}
