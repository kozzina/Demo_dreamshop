"use client";

import Link from "next/link";
import { useState } from "react";
import { MAX_QTY_PER_DREAM } from "@/domain/cart";
import type { DreamSlug } from "@/domain/catalog";
import { api } from "../api";
import { errorMessage } from "../format";
import { useBookableNights } from "../use-bookable-nights";
import { useShop } from "../shop-context";
import { haptic } from "../telegram";
import { Icon } from "./Icon";
import { NightPicker } from "./NightPicker";
import { Stepper } from "./Stepper";
import styles from "./AddToCart.module.css";

type Message = { kind: "ok" | "error"; text: string };

/** Night, quantity and «В корзину» on the dream page. Rules are checked by the server; errors are shown inline. */
export function AddToCart({ slug, price }: { slug: DreamSlug; price: string }) {
  const { catalog, cart, changeCart, ready } = useShop();
  const nights = useBookableNights();
  const [chosenNight, setNight] = useState<string | null>(null);
  const night = chosenNight ?? nights[0];
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);

  const inStock = catalog.find((d) => d.slug === slug)?.inStock ?? 0;
  const inCart = cart.items.find((item) => item.slug === slug)?.qty ?? 0;
  const max = Math.max(1, Math.min(MAX_QTY_PER_DREAM - inCart, inStock - inCart));

  if (ready && inStock === 0) return <p className={styles.out}>Сейчас нет в наличии — загляните позже или выберите другой сон.</p>;

  async function add() {
    if (!night) return;
    setBusy(true);
    setMessage(null);
    const error = await changeCart(() => api.addToCart(slug, qty, night));
    setBusy(false);
    haptic(error ? "error" : "success");
    setMessage(error ? { kind: "error", text: errorMessage(error) } : { kind: "ok", text: "Сон в корзине" });
  }

  return (
    <div className={styles.box}>
      <NightPicker name={`night-${slug}`} nights={nights} value={night} onChange={setNight} />
      <div className={styles.row}>
        <Stepper label="Количество" value={qty} min={1} max={max} onChange={setQty} />
        <button type="button" className={styles.primary} disabled={busy || !ready || !night} onClick={add}>
          {busy ? "Кладём…" : <>В корзину <span className={styles.price}>{price}</span></>}
        </button>
      </div>
      <p className={message?.kind === "error" ? styles.error : styles.ok} role="status">
        {message?.kind === "ok" && (
          <>
            <Icon name="check" size={18} />
            {message.text} · <Link href="/app/cart">Перейти в корзину</Link>
          </>
        )}
        {message?.kind === "error" && message.text}
      </p>
    </div>
  );
}
