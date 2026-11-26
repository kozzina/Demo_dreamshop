import { bigserial, bigint, date, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Database schema. The catalogue lives in code (src/domain/catalog.ts); the database keeps only
 * what changes: buyer sessions, carts, orders, the manager feed, chat and AI spend.
 * Stock of a session = catalogue stock − dreams in that session's non-cancelled orders, so no stock table.
 */

/** A buyer's sandbox. Carts and chats expire with it after 24 hours; orders stay for the feed. */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel: text("channel", { enum: ["web", "telegram"] }).notNull(),
  /** Fictional buyer name shown in the feed, e.g. «Покупатель Луна». Real Telegram names are never stored. */
  alias: text("alias").notNull(),
  lang: text("lang", { enum: ["ru", "en"] }).notNull().default("ru"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const cartLines = pgTable(
  "cart_lines",
  {
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    qty: integer("qty").notNull(),
    night: date("night").notNull(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.slug] })],
);

export const orders = pgTable(
  "orders",
  {
    /** Order number shown to people, starts at 1041. */
    number: integer("number").primaryKey().generatedAlwaysAsIdentity({ startWith: 1041 }),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
    channel: text("channel", { enum: ["web", "telegram"] }).notNull(),
    alias: text("alias").notNull(),
    /** Only to send the owner status updates; deleted with the order after 30 days. */
    telegramChatId: bigint("telegram_chat_id", { mode: "number" }),
    totalCents: integer("total_cents").notNull(),
    status: text("status", { enum: ["new", "accepted", "assembling", "delivering", "delivered", "cancelled"] }).notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_session_idx").on(t.sessionId), index("orders_status_changed_idx").on(t.status, t.statusChangedAt)],
);

export const orderItems = pgTable(
  "order_items",
  {
    orderNumber: integer("order_number").notNull().references(() => orders.number, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    qty: integer("qty").notNull(),
    night: date("night").notNull(),
    priceCents: integer("price_cents").notNull(),
  },
  (t) => [primaryKey({ columns: [t.orderNumber, t.slug] })],
);

/** The shared manager feed: new orders, status changes, low stock, calls for a human. No personal data. */
export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderNumber: integer("order_number").references(() => orders.number, { onDelete: "cascade" }),
    type: text("type", { enum: ["order_created", "status_changed", "low_stock", "manager_called", "payment_passed"] }).notNull(),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_created_idx").on(t.createdAt)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "tool"] }).notNull(),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_messages_session_idx").on(t.sessionId, t.id)],
);

/** AI spend per buyer per day: enforces the message limit and the daily budget. */
export const aiUsage = pgTable(
  "ai_usage",
  {
    day: date("day").notNull(),
    sessionId: uuid("session_id").notNull(),
    messages: integer("messages").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 10, scale: 4 }).notNull().default("0"),
  },
  (t) => [primaryKey({ columns: [t.day, t.sessionId] })],
);
