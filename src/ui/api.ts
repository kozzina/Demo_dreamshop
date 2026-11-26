import type { ApiError, CartView, CatalogItem, OrderView } from "@/shared/contract";

/** Typed client for the shop API. Errors come back as values, not exceptions: the UI shows them. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const SESSION_KEY = "dream-shop:session";

export const storedSession = (): string | null => (typeof window === "undefined" ? null : localStorage.getItem(SESSION_KEY));
export const storeSession = (id: string) => localStorage.setItem(SESSION_KEY, id);
export const forgetSession = () => localStorage.removeItem(SESSION_KEY);

async function request<T>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
  const session = storedSession();
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json", ...(session ? { "x-session-id": session } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: "network" }));
  return res.ok ? { ok: true, data: data as T } : { ok: false, error: data as ApiError };
}

export const api = {
  createSession: () => request<{ id: string; alias: string }>("POST", "/api/session", { lang: "ru" }),
  catalog: () => request<CatalogItem[]>("GET", "/api/catalog"),
  cart: () => request<CartView>("GET", "/api/cart"),
  addToCart: (slug: string, qty: number, night: string) => request<CartView>("POST", "/api/cart", { slug, qty, night }),
  updateCart: (slug: string, qty: number, night?: string) => request<CartView>("PATCH", "/api/cart", { slug, qty, night }),
  clearCart: () => request<CartView>("DELETE", "/api/cart"),
  orders: () => request<OrderView[]>("GET", "/api/orders"),
  placeOrder: () => request<OrderView>("POST", "/api/orders"),
};
