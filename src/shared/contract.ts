/**
 * Shapes of the API responses, shared by the route handlers and the mini app.
 * Type-only: nothing here runs, so it is safe to import on both sides.
 */
import type { AgeRating, DreamSlug } from "@/domain/catalog";
import type { OrderStatus } from "@/domain/order";

export interface CatalogItem {
  slug: DreamSlug;
  name: { ru: string; en: string };
  genre: string;
  minutes: number;
  age: AgeRating;
  price: string;
  inStock: number;
  wholeNight: boolean;
  cover: string;
}

/** Static texts of a dream from the knowledge base: server pages pass them to list cards. */
export interface DreamBlurb {
  teaser: string;
  mood: string[];
}

export interface CartItem {
  slug: DreamSlug;
  name: string;
  qty: number;
  night: string;
  price: string;
}

export interface CartView {
  items: CartItem[];
  total: string;
}

export interface OrderView {
  number: number;
  status: OrderStatus;
  total: string;
  items: CartItem[];
  createdAt: string;
}

export interface ManagerStats {
  ordersToday: number;
  totalToday: string;
}

/** An event of the shared manager feed, newest first from the API. */
export interface FeedEvent {
  id: number;
  type: "order_created" | "status_changed" | "low_stock" | "manager_called" | "payment_passed";
  orderNumber: number | null;
  /** Current status of the event's order, so old messages show where the order is now. */
  orderStatus: OrderStatus | null;
  /** The viewer's own order: shown as «Ваш заказ». */
  mine: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** One visible line of the chat with the assistant. */
export interface ChatLine {
  role: "buyer" | "assistant";
  text: string;
}

export interface ChatReply {
  /** One or two messages, as a person would send them. */
  messages: string[];
  /** Tool calls behind the answer, for the «под капотом» view on the site. */
  trace: string[];
  /** The cart or orders changed. */
  changed: boolean;
}

export interface ApiError {
  error: string;
  details?: Record<string, unknown>;
}
