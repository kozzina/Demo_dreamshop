"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ApiError, CartView, CatalogItem } from "@/shared/contract";
import { api, forgetSession, storedSession, storeSession, type ApiResult } from "./api";
import { initTelegram } from "./telegram";

interface Shop {
  ready: boolean;
  catalog: CatalogItem[];
  cart: CartView;
  cartCount: number;
  /** Runs a cart change and refreshes cart and stock; returns the API error, if any, for the UI to show. */
  changeCart: (action: () => Promise<ApiResult<CartView>>) => Promise<ApiError | null>;
  refresh: () => Promise<void>;
}

const EMPTY_CART: CartView = { items: [], total: "$0.00" };
const ShopContext = createContext<Shop | null>(null);

/** One buyer session for the whole mini app: created on first visit, kept in localStorage for a day. */
async function ensureSession(): Promise<void> {
  if (storedSession()) {
    const check = await api.cart();
    if (check.ok) return;
    forgetSession();
  }
  const created = await api.createSession();
  if (created.ok) storeSession(created.data.id);
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<CartView>(EMPTY_CART);

  const refresh = useCallback(async () => {
    const [nextCatalog, nextCart] = await Promise.all([api.catalog(), api.cart()]);
    if (nextCatalog.ok) setCatalog(nextCatalog.data);
    if (nextCart.ok) setCart(nextCart.data);
  }, []);

  useEffect(() => {
    initTelegram();
    ensureSession()
      .then(refresh)
      .finally(() => setReady(true));
  }, [refresh]);

  const changeCart = useCallback(
    async (action: () => Promise<ApiResult<CartView>>) => {
      const result = await action();
      if (!result.ok) return result.error;
      setCart(result.data);
      const nextCatalog = await api.catalog();
      if (nextCatalog.ok) setCatalog(nextCatalog.data);
      return null;
    },
    [],
  );

  const value = useMemo<Shop>(
    () => ({ ready, catalog, cart, cartCount: cart.items.reduce((n, item) => n + item.qty, 0), changeCart, refresh }),
    [ready, catalog, cart, changeCart, refresh],
  );
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): Shop {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("useShop must be used inside <ShopProvider>");
  return shop;
}
