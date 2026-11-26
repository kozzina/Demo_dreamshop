"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MAX_QTY_PER_DREAM } from "@/domain/cart";
import { coverPath } from "@/domain/catalog";
import type { CartItem } from "@/shared/contract";
import { api } from "@/ui/api";
import { EmptyState } from "@/ui/components/EmptyState";
import { Icon } from "@/ui/components/Icon";
import { Stepper } from "@/ui/components/Stepper";
import { errorMessage, nightLabel, typo } from "@/ui/format";
import { useBookableNights } from "@/ui/use-bookable-nights";
import { useShop } from "@/ui/shop-context";
import { haptic } from "@/ui/telegram";
import styles from "./cart.module.css";

export default function CartPage() {
  const { cart, changeCart, ready } = useShop();
  const [confirmClear, setConfirmClear] = useState(false);

  if (ready && cart.items.length === 0) {
    return <EmptyState icon="bag" title="Корзина пуста" text="В каталоге есть сны на любое настроение." action={{ href: "/app", label: "В каталог" }} />;
  }

  const nights = [...new Set(cart.items.map((item) => item.night))].sort();

  async function clear() {
    if (!confirmClear) return setConfirmClear(true);
    await changeCart(api.clearCart);
    setConfirmClear(false);
  }

  return (
    <>
      <h1 className={styles.title}>Корзина</h1>
      <p className={styles.rules}>
        <Icon name="moon" size={18} />
        <span>{typo("На одну ночь — до двух снов и до 6 часов. «Сон без будильника» — на отдельную\u00a0ночь.")}</span>
      </p>

      {nights.map((night) => (
        <section key={night} className={styles.night} aria-labelledby={`night-${night}`}>
          <h2 id={`night-${night}`}>{nightLabel(night)}</h2>
          <ul>
            {cart.items
              .filter((item) => item.night === night)
              .map((item) => (
                <CartLine key={item.slug} item={item} />
              ))}
          </ul>
        </section>
      ))}

      <button type="button" className={styles.clear} onClick={clear} onBlur={() => setConfirmClear(false)}>
        {confirmClear ? "Точно очистить? Нажмите ещё раз" : "Очистить корзину"}
      </button>

      <div className={styles.summary}>
        <div>
          <span className={styles.totalLabel}>Итого</span>
          <b className={styles.total}>{cart.total}</b>
        </div>
        <Link href="/app/checkout" className={styles.primary}>Оформить</Link>
      </div>
    </>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const { catalog, changeCart } = useShop();
  const bookable = useBookableNights();
  const [error, setError] = useState("");
  const inStock = catalog.find((d) => d.slug === item.slug)?.inStock ?? item.qty;

  async function update(qty: number, night?: string) {
    const result = await changeCart(() => api.updateCart(item.slug, qty, night));
    haptic(result ? "error" : "tap");
    setError(result ? errorMessage(result) : "");
  }

  return (
    <li className={styles.line}>
      <Link href={`/app/dream/${item.slug}`} className={styles.thumb} tabIndex={-1} aria-hidden>
        <Image src={coverPath(item.slug)} alt="" fill sizes="72px" />
      </Link>
      <div className={styles.info}>
        <Link href={`/app/dream/${item.slug}`} className={styles.name}>{item.name}</Link>
        <span className={styles.price}>{item.price} за шт.</span>
        <label className={styles.select}>
          <span className="visually-hidden">Ночь для «{item.name}»</span>
          <select value={item.night} onChange={(e) => update(item.qty, e.target.value)}>
            {bookable.map((n) => (
              <option key={n} value={n}>{nightLabel(n)}</option>
            ))}
          </select>
        </label>
      </div>
      <Stepper label={`Количество «${item.name}»`} value={item.qty} min={1} max={Math.min(MAX_QTY_PER_DREAM, inStock)} onChange={(qty) => update(qty)} removeAtMin />
      {error && <p className={styles.error} role="alert">{error}</p>}
    </li>
  );
}
