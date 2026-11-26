"use client";

import Link from "next/link";
import { useState } from "react";
import { MAX_QTY_PER_DREAM, nightConflict } from "@/domain/cart";
import type { DreamSlug } from "@/domain/catalog";
import { api } from "../api";
import { errorMessage, nightLabel } from "../format";
import { useBookableNights } from "../use-bookable-nights";
import { useShop } from "../shop-context";
import { haptic } from "../telegram";
import { Icon } from "./Icon";
import { NightPicker } from "./NightPicker";
import { Sheet } from "./Sheet";
import { Stepper } from "./Stepper";
import styles from "./BuyBar.module.css";

type Message = { kind: "ok" | "error"; text: string };

/**
 * Sticky price and «Выбрать ночь» at the bottom of the dream page. The sheet holds the night
 * strip (taken nights are marked from the cart), quantity and «В корзину». The server re-checks.
 */
export function BuyBar({ slug, name, price }: { slug: DreamSlug; name: string; price: string }) {
  const { catalog, cart, changeCart, ready } = useShop();
  const nights = useBookableNights();
  const [open, setOpen] = useState(false);
  const [chosenNight, setNight] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const inStock = catalog.find((d) => d.slug === slug)?.inStock ?? 0;
  const inCart = cart.items.find((item) => item.slug === slug);
  const others = cart.items.filter((item) => item.slug !== slug);
  const isTaken = (night: string) => nightConflict(others, slug, night) !== null;
  // A dream already in the cart stays on its night; otherwise the first night that fits.
  const night = inCart?.night ?? chosenNight ?? nights.find((n) => !isTaken(n));
  const max = Math.max(1, Math.min(MAX_QTY_PER_DREAM - (inCart?.qty ?? 0), inStock - (inCart?.qty ?? 0)));
  const soldOut = ready && inStock === 0;

  async function add() {
    if (!night) return;
    setBusy(true);
    setMessage(null);
    const error = await changeCart(() => api.addToCart(slug, qty, night));
    setBusy(false);
    haptic(error ? "error" : "success");
    if (error) return setMessage({ kind: "error", text: errorMessage(error) });
    setOpen(false);
    setQty(1);
    setMessage({ kind: "ok", text: `В корзине на ${nightLabel(night).toLowerCase()}` });
  }

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.price}>
          <span>{soldOut ? "Нет в наличии" : inCart ? `В корзине: ${inCart.qty}` : "Цена"}</span>
          <b>{price}</b>
        </div>
        {message?.kind === "ok" ? (
          <Link href="/app/cart" className={styles.primary}>
            <Icon name="check" size={18} />
            В корзину
          </Link>
        ) : (
          <button type="button" className={styles.primary} disabled={!ready || soldOut} onClick={() => setOpen(true)} aria-haspopup="dialog">
            <Icon name="calendar" size={18} />
            {soldOut ? "Скоро вернётся" : "Выбрать ночь"}
          </button>
        )}
      </div>
      <p className={styles.status} role="status">
        {message?.kind === "ok" ? message.text : ""}
      </p>

      <Sheet open={open} onClose={() => setOpen(false)} title={name}>
        <div className={styles.sheetBody}>
          {inCart ? (
            <p className={styles.note}>Этот сон уже в корзине на {nightLabel(inCart.night).toLowerCase()} — добавим туда же. Ночь можно сменить в корзине.</p>
          ) : (
            <NightPicker name={`night-${slug}`} nights={nights} value={night} onChange={setNight} isTaken={isTaken} />
          )}
          <p className={styles.rules}>На одну ночь — до двух снов и до 6 часов. Занятые ночи отмечены.</p>
          <div className={styles.row}>
            <Stepper label="Количество" value={qty} min={1} max={max} onChange={setQty} />
            <button type="button" className={styles.add} disabled={busy || !night} onClick={add}>
              {busy ? "Кладём…" : "В корзину"}
            </button>
          </div>
          {message?.kind === "error" && (
            <p className={styles.error} role="alert">
              {message.text}
            </p>
          )}
        </div>
      </Sheet>
    </>
  );
}
