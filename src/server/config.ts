import "server-only";

/**
 * Server configuration from environment variables. Read once, validated, typed.
 * Secrets never reach the client: this module is server-only.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function number(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid number in ${name}: ${raw}`);
  return value;
}

export const config = {
  /** Public address of this app, e.g. https://dream-shop.example.com — the bot links the mini app to it. */
  appUrl: () => required("APP_URL").replace(/\/$/, ""),
  telegram: {
    botToken: () => required("TELEGRAM_BOT_TOKEN"),
    webhookSecret: () => required("TELEGRAM_WEBHOOK_SECRET"),
  },
  assistant: {
    apiKey: () => required("ANTHROPIC_API_KEY"),
    /** Chosen by the test runs in eval/: every dialog passed, no invented prices. */
    model: process.env.ASSISTANT_MODEL ?? "claude-haiku-5-5",
    /** Messages one buyer can send to the assistant per day — enough to try it, cheap to run. */
    messagesPerDay: number("ASSISTANT_MESSAGES_PER_DAY", 20),
    /** Hard daily cap for all buyers together; the shop keeps working without the assistant. */
    dailyBudgetUsd: number("ASSISTANT_DAILY_BUDGET_USD", 2),
  },
  database: {
    url: () => required("DATABASE_URL"),
  },
} as const;
