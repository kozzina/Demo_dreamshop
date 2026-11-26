"use client";

import Link from "next/link";
import { useState } from "react";
import { MAX_QTY_PER_DREAM } from "@/domain/cart";
import type { DreamSlug } from "@/domain/catalog";
import { api } from "../api";
import { errorMessage, nightLabel } from "../format";
import { useBookableNights } from "../use-bookable-nights";
import { useShop } from "../shop-context";
import { haptic } from "../telegram";
import styles from "./AddToCart.module.css";

/** Night, quantity and «В корзину» on the dream page. Rules are checked by the server; errors are shown inline. */
export function AddToCart({ slug }: { slug: DreamSlug }) {
  const { catalog, cart, changeCart, ready } = useShop();
  const nights = useBookableNights();
  const [chosenNight, setNight] = useState<string | null>(null);
  const night = chosenNight ?? nights[0];
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const inStock = catalog.find((d) => d.slug === slug)?.inStock ?? 0;
  const inCart = cart.items.find((item) => item.slug === slug)?.qty ?? 0;
  const max = Math.max(1, Math.min(MAX_QTY_PER_DREAM - inCart, inStock - inCart));

  if (ready && inStock === 0) return <p className={styles.out}>Сейчас нет в наличии.</p>;

  async function add() {
    setBusy(true);
    setMessage(null);
    if (!night) return;
    const error = await changeCart(() => api.addToCart(slug, qty, night));
    setBusy(false);
    haptic(error ? "error" : "success");
    setMessage(error ? { kind: "error", text: errorMessage(error) } : { kind: "ok", text: "Добавлено в корзину" });
  }

  return (
    <div className={styles.box}>
      <label className={styles.field}>
        <span>Ночь</span>
        <select value={night ?? ""} onChange={(e) => setNight(e.target.value)}>
          {nights.map((n) => (
            <option key={n} value={n}>{nightLabel(n)}</option>
          ))}
        </select>
      </label>
      <div className={styles.field}>
        <span id={`qty-${slug}`}>Количество</span>
        <div className={styles.stepper} role="group" aria-labelledby={`qty-${slug}`}>
          <button type="button" aria-label="Меньше" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" aria-label="Больше" disabled={qty >= max} onClick={() => setQty(qty + 1)}>+</button>
        </div>
      </div>
      <button type="button" className={styles.primary} disabled={busy || !ready || !night} onClick={add}>
        {busy ? "Кладём…" : "В корзину"}
      </button>
      {message && (
        <p className={message.kind === "ok" ? styles.ok : styles.error} role="status">
          {message.text}
          {message.kind === "ok" && <> · <Link href="/app/cart">Перейти в корзину</Link></>}
        </p>
      )}
    </div>
  );
}
