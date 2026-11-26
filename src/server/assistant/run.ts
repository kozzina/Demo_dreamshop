import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { and, desc, eq, sql } from "drizzle-orm";
import { today } from "@/domain/nights";
import { config } from "../config";
import { db } from "../db/client";
import { aiUsage, chatMessages } from "../db/schema";
import type { Session } from "../shop/sessions";
import { systemBlocks } from "./prompt";
import { splitReply } from "./split";
import { runTool, TOOLS } from "./tools";

/** Tool rounds per buyer message: enough to search, add and check the cart; stops runaway loops. */
const MAX_TOOL_ROUNDS = 6;
/** Short chat replies; the prompt asks for 1–3 sentences. */
const MAX_OUTPUT_TOKENS = 700;
/** Earlier turns sent with each message: the chat stays coherent and the request stays small. */
const HISTORY_ROWS = 30;

/** Claude Haiku 5.5 prices, USD per million tokens (prompts up to 100K tokens). Cache writes 1.25×, reads 0.1×. */
const PRICE = { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 };

/**
 * Limit replies say plainly that this is a demo rule, not Sonya's choice:
 * the per-buyer message cap and the shared daily AI budget read differently.
 */
export const limitReply = (messagesPerDay: number) =>
  `Это демо, и в нём у меня лимит — ${messagesPerDay} сообщений в день на одного покупателя, чтобы AI не расходовался зря. На сегодня он закончился, завтра я снова на связи. А магазин работает и без меня: каталог, корзина и заказы — в мини-приложении.`;
export const BUDGET_REPLY =
  "Это демо, и у него дневной бюджет на AI для всех посетителей — на сегодня он закончился. Завтра я снова на связи, а магазин работает и без меня: всё можно оформить в мини-приложении.";
export const FALLBACK_REPLY = "Что-то я задумалась и потеряла мысль. Напишите ещё раз через минуту — а магазин работает, всё есть в мини-приложении.";

export interface AssistantReply {
  /** One or two chat messages, like a person would send. */
  messages: string[];
  /** Tool calls in order, for the «под капотом» view. */
  trace: string[];
  /** The cart or orders changed: open screens should refresh. */
  changed: boolean;
  /** Why there is no model answer: the daily limits, or the model was unavailable. */
  fallback?: "limit" | "error";
}

let client: Anthropic | undefined;
const anthropic = () => (client ??= new Anthropic({ apiKey: config.assistant.apiKey(), baseURL: config.assistant.baseUrl, maxRetries: 2, timeout: 30_000 }));

/** Today's message count for this buyer and today's spend for everyone. */
async function usageToday(sessionId: string) {
  const day = today();
  const [mine] = await db().select({ messages: aiUsage.messages }).from(aiUsage).where(and(eq(aiUsage.day, day), eq(aiUsage.sessionId, sessionId)));
  const [all] = await db().select({ cost: sql<string>`coalesce(sum(${aiUsage.costUsd}), 0)` }).from(aiUsage).where(eq(aiUsage.day, day));
  return { messages: mine?.messages ?? 0, costUsd: Number(all.cost) };
}

async function recordUsage(sessionId: string, costUsd: number) {
  const cost = costUsd.toFixed(4);
  await db()
    .insert(aiUsage)
    .values({ day: today(), sessionId, messages: 1, costUsd: cost })
    .onConflictDoUpdate({
      target: [aiUsage.day, aiUsage.sessionId],
      set: { messages: sql`${aiUsage.messages} + 1`, costUsd: sql`${aiUsage.costUsd} + ${cost}` },
    });
}

const costOf = (u: Anthropic.Usage) =>
  (u.input_tokens * PRICE.input + u.output_tokens * PRICE.output + (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite + (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead) / 1e6;

/**
 * Earlier turns of this buyer, oldest first. The history must start with the buyer's own text,
 * so a tool exchange cut in half by the row limit is dropped from the front.
 */
async function loadHistory(sessionId: string): Promise<Anthropic.MessageParam[]> {
  const rows = await db().select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(desc(chatMessages.id)).limit(HISTORY_ROWS);
  const history = rows.reverse().map((row) => ({ role: row.role === "assistant" ? "assistant" : "user", content: row.content }) as Anthropic.MessageParam);
  const start = history.findIndex((m) => m.role === "user" && typeof m.content === "string");
  return start < 0 ? [] : history.slice(start);
}

const textOf = (content: Anthropic.ContentBlock[]) =>
  content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("\n")
    .trim();

/**
 * One buyer message → Sonya's answer. Checks the limits, runs the tool loop on this buyer's
 * sandbox, stores the turn and the spend. Never throws: on any failure the buyer gets a short
 * human fallback and the shop keeps working without the assistant.
 */
export async function askAssistant(session: Session, text: string): Promise<AssistantReply> {
  const usage = await usageToday(session.id);
  if (usage.messages >= config.assistant.messagesPerDay) {
    return { messages: [limitReply(config.assistant.messagesPerDay)], trace: [], changed: false, fallback: "limit" };
  }
  if (usage.costUsd >= config.assistant.dailyBudgetUsd) {
    return { messages: [BUDGET_REPLY], trace: [], changed: false, fallback: "limit" };
  }

  const turn: Anthropic.MessageParam[] = [{ role: "user", content: text.slice(0, 2000) }];
  const trace: string[] = [];
  let changed = false;
  let cost = 0;

  try {
    const history = await loadHistory(session.id);
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic().messages.create({
        model: config.assistant.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        // Chat latency matters more than deliberation here; the shop rules are enforced by the tools.
        thinking: { type: "disabled" },
        system: systemBlocks(today()),
        tools: TOOLS,
        messages: [...history, ...turn],
      });
      cost += costOf(response.usage);
      turn.push({ role: "assistant", content: response.content });

      const calls = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (response.stop_reason !== "tool_use" || calls.length === 0 || round === MAX_TOOL_ROUNDS) {
        // A turn that ends on unanswered tool calls would break the next request: keep only the text.
        if (calls.length > 0) turn[turn.length - 1] = { role: "assistant", content: textOf(response.content) || "…" };
        await db().insert(chatMessages).values(turn.map((m) => ({ sessionId: session.id, role: m.role === "assistant" ? ("assistant" as const) : ("user" as const), content: m.content })));
        await recordUsage(session.id, cost);
        // The model name stays private: the trace shows what was done and what it cost.
        trace.push(`ответ готов · $${cost.toFixed(4)}`);
        const answer = textOf(response.content);
        return { messages: answer ? splitReply(answer) : [FALLBACK_REPLY], trace, changed };
      }

      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const call of calls) {
        try {
          const outcome = await runTool(session, call.name, call.input);
          trace.push(outcome.trace);
          changed ||= outcome.changed;
          results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(outcome.result) });
        } catch (err) {
          // Input that fails validation: tell the model, let it recover.
          console.error("[assistant tool]", call.name, err);
          results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify({ error: "bad_input" }), is_error: true });
        }
      }
      turn.push({ role: "user", content: results });
    }
  } catch (err) {
    console.error("[assistant]", err instanceof Anthropic.APIError ? `${err.status} ${err.name}` : err);
    if (cost > 0) await recordUsage(session.id, cost).catch(() => {});
  }
  return { messages: [FALLBACK_REPLY], trace, changed, fallback: "error" };
}
