/** Below this length an answer goes as one message. */
const SPLIT_FROM = 280;

/**
 * A longer answer goes as two messages, the way a person writes in a chat:
 * split at a paragraph break, or else at the last sentence break that leaves a real second part.
 */
export function splitReply(text: string): string[] {
  const clean = text.trim();
  if (clean.length < SPLIT_FROM) return [clean];
  const paragraph = clean.indexOf("\n\n", 120);
  if (paragraph > 0) return [clean.slice(0, paragraph).trim(), clean.slice(paragraph).trim()];
  const sentence = clean.slice(0, clean.length - 60).lastIndexOf(". ");
  return sentence > 120 ? [clean.slice(0, sentence + 1).trim(), clean.slice(sentence + 1).trim()] : [clean];
}
