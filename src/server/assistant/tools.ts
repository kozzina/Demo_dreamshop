import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CATALOG, findDream, type Dream } from "@/domain/catalog";
import { formatUsd } from "@/domain/money";
import { addDays, today } from "@/domain/nights";
import { dreamDetails } from "../knowledge";
import { addToCart, clearCart, getCart, sessionStock, updateCartLine } from "../shop/cart";
import { callManager, getOrder, listOrders, placeOrder } from "../shop/orders";
import type { Session } from "../shop/sessions";

/**
 * Sonya's tools. The model only asks; every call runs through the same server functions as the
 * mini app, on this buyer's sandbox, with the same rules. Inputs are validated here, not trusted.
 */
const slug = { type: "string", description: "slug сна из каталога, например forest-cabin" } as const;
const night = { type: "string", description: "Ночь доставки: today, tomorrow или YYYY-MM-DD" } as const;
const none = { type: "object", properties: {}, additionalProperties: false } as const;

export const TOOLS: Anthropic.Tool[] = [
  { name: "search_products", description: "Подбор снов по описанию, настроению, поводу. Возвращает сны с ценой, наличием, возрастом и длительностью.", input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false } },
  { name: "get_product", description: "Всё о сне: цена, остаток, возраст, длительность.", input_schema: { type: "object", properties: { slug }, required: ["slug"], additionalProperties: false } },
  { name: "add_to_cart", description: "Положить сон в корзину. Если ночь не указана — ближайшая.", input_schema: { type: "object", properties: { slug, qty: { type: "integer", minimum: 1 }, night }, required: ["slug", "qty"], additionalProperties: false } },
  { name: "update_cart", description: "Изменить сон в корзине: количество (qty = 0 убирает его) и/или ночь.", input_schema: { type: "object", properties: { slug, qty: { type: "integer", minimum: 0 }, night }, required: ["slug", "qty"], additionalProperties: false } },
  { name: "clear_cart", description: "Очистить корзину целиком.", input_schema: none },
  { name: "get_cart", description: "Корзина и сумма.", input_schema: none },
  { name: "place_order", description: "Оформить заказ из корзины. Только по явной просьбе покупателя.", input_schema: none },
  { name: "get_my_orders", description: "Заказы этого покупателя: номера, статусы, суммы.", input_schema: none },
  { name: "get_order_status", description: "Статус заказа покупателя по номеру. Чужие заказы не находятся.", input_schema: { type: "object", properties: { number: { type: "integer" } }, required: ["number"], additionalProperties: false } },
  { name: "call_manager", description: "Позвать живого менеджера: претензия, отмена, перенос, подарочный сертификат, вопрос вне базы знаний.", input_schema: { type: "object", properties: { reason: { type: "string" }, order_number: { type: "integer" } }, required: ["reason"], additionalProperties: false } },
];

const Slug = z.object({ slug: z.string() });
const Line = z.object({ slug: z.string(), qty: z.number().int(), night: z.string().optional() });
const Query = z.object({ query: z.string().max(300) });
const Number_ = z.object({ number: z.number().int() });
const Manager = z.object({ reason: z.string().min(1).max(300), order_number: z.number().int().optional() });

/** «today», «tomorrow» or a date; anything else goes to the server as is and fails its check. */
function toNight(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "today" || v === "сегодня") return today();
  if (v === "tomorrow" || v === "завтра") return addDays(today(), 1);
  return v;
}

function dreamCard(dream: Dream, stock: number) {
  return { slug: dream.slug, name: dream.name.ru, genre: dream.genre, minutes: dream.minutes, age: dream.age, price: formatUsd(dream.price), in_stock: stock, whole_night: dream.wholeNight };
}

/** Plain word overlap over name, genre, mood and description: the full knowledge base is in the prompt anyway. */
function search(query: string): Dream[] {
  const words = query.toLowerCase().split(/[^a-zа-яё0-9]+/i).filter((w) => w.length > 2);
  const scored = CATALOG.map((dream) => {
    const d = dreamDetails(dream.slug);
    const text = [dream.name.ru, dream.name.en, dream.genre, d?.mood.join(" "), d?.teaser, d?.goodFor, d?.feelings].join(" ").toLowerCase();
    return { dream, score: words.filter((w) => text.includes(w.slice(0, Math.max(4, w.length - 2)))).length };
  });
  const hits = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  return (hits.length > 0 ? hits.slice(0, 4) : scored).map((s) => s.dream);
}

export interface ToolOutcome {
  /** JSON for the model. */
  result: unknown;
  /** One line for the «под капотом» view, e.g. `add_to_cart(forest-cabin, 1) ✓`. */
  trace: string;
  /** The buyer's cart or orders changed, so open screens should refresh. */
  changed: boolean;
}

const failed = (error: string, details?: unknown) => ({ error, details });

export async function runTool(session: Session, name: string, input: unknown): Promise<ToolOutcome> {
  switch (name) {
    case "search_products": {
      const { query } = Query.parse(input);
      const stock = await sessionStock(session.id);
      const found = search(query);
      return { result: found.map((d) => dreamCard(d, stock[d.slug])), trace: `search_products("${query}") · ${found.length}`, changed: false };
    }
    case "get_product": {
      const { slug: s } = Slug.parse(input);
      const dream = findDream(s);
      if (!dream) return { result: failed("unknown_slug"), trace: `get_product(${s}) ✗`, changed: false };
      const stock = await sessionStock(session.id);
      return { result: dreamCard(dream, stock[dream.slug]), trace: `get_product(${s}) = ${stock[dream.slug]} шт.`, changed: false };
    }
    case "add_to_cart":
    case "update_cart": {
      const line = Line.parse(input);
      const run = name === "add_to_cart" ? addToCart : updateCartLine;
      const result = await run(session.id, line.slug, line.qty, toNight(line.night));
      const mark = result.ok ? "✓" : `✗ ${result.error}`;
      return { result: result.ok ? result.value : failed(result.error, result.details), trace: `${name}(${line.slug}, ${line.qty}${line.night ? `, ${line.night}` : ""}) ${mark}`, changed: result.ok };
    }
    case "clear_cart":
      return { result: await clearCart(session.id), trace: "clear_cart() ✓", changed: true };
    case "get_cart": {
      const cart = await getCart(session.id);
      return { result: cart, trace: `get_cart() = ${cart.total}`, changed: false };
    }
    case "place_order": {
      const result = await placeOrder(session);
      return {
        result: result.ok ? result.value : failed(result.error, result.details),
        trace: result.ok ? `place_order() = №${result.value.number}` : `place_order() ✗ ${result.error}`,
        changed: result.ok,
      };
    }
    case "get_my_orders": {
      const orders = await listOrders(session.id);
      return { result: orders.slice(0, 5).map((o) => ({ number: o.number, status: o.status, total: o.total })), trace: `get_my_orders() · ${orders.length}`, changed: false };
    }
    case "get_order_status": {
      const { number } = Number_.parse(input);
      const order = await getOrder(session.id, number);
      return { result: order ?? failed("not_found"), trace: `get_order_status(${number}) = ${order?.status ?? "not_found"}`, changed: false };
    }
    case "call_manager": {
      const { reason, order_number } = Manager.parse(input);
      // Link the event to an order only if it is this buyer's own order.
      const own = order_number !== undefined && (await getOrder(session.id, order_number)) !== null;
      await callManager(session, reason, own ? order_number : undefined);
      return { result: { called: true }, trace: "call_manager() ✓", changed: false };
    }
    default:
      return { result: failed("unknown_tool"), trace: `${name}() ✗`, changed: false };
  }
}
