"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MAX_QTY_PER_DREAM } from "@/domain/cart";
import { coverPath } from "@/domain/catalog";
import type { CartItem } from "@/shared/contract";
import { api } from "@/ui/api";
import { errorMessage, nightLabel } from "@/ui/format";
import { useBookableNights } from "@/ui/use-bookable-nights";
import { useShop } from "@/ui/shop-context";
import { haptic } from "@/ui/telegram";
import styles from "./cart.module.css";

export default function CartPage() {
  const { cart, catalog, changeCart, ready } = useShop();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const bookable = useBookableNights();

  async function update(item: CartItem, qty: number, night?: string) {
    const error = await changeCart(() => api.updateCart(item.slug, qty, night));
    haptic(error ? "error" : "tap");
    setErrors((prev) => ({ ...prev, [item.slug]: error ? errorMessage(error) : "" }));
  }

  if (ready && cart.items.length === 0) {
    return (
      <div className={styles.empty}>
        <h1>Корзина пуста</h1>
        <p>Загляните в каталог — там есть сны на любое настроение.</p>
        <Link href="/app" className={styles.primary}>В каталог</Link>
      </div>
    );
  }

  const nights = [...new Set(cart.items.map((item) => item.night))].sort();

  return (
    <>
      <h1 className={styles.title}>Корзина</h1>
      <p className={styles.rules}>На одну ночь — до двух снов и до 6 часов. «Сон без будильника» — на отдельную ночь.</p>

      {nights.map((night) => (
        <section key={night} className={styles.night}>
          <h2>{nightLabel(night)}</h2>
          <ul>
            {cart.items
              .filter((item) => item.night === night)
              .map((item) => {
                const inStock = catalog.find((d) => d.slug === item.slug)?.inStock ?? item.qty;
                return (
                  <li key={item.slug} className={styles.line}>
                    <span className={styles.thumb}>
                      <Image src={coverPath(item.slug)} alt="" fill sizes="64px" />
                    </span>
                    <div className={styles.info}>
                      <Link href={`/app/dream/${item.slug}`} className={styles.name}>{item.name}</Link>
                      <span className={styles.price}>{item.price} × {item.qty}</span>
                      <select aria-label={`Ночь для «${item.name}»`} value={item.night} onChange={(e) => update(item, item.qty, e.target.value)}>
                        {bookable.map((n) => (
                          <option key={n} value={n}>{nightLabel(n)}</option>
                        ))}
                      </select>
                      {errors[item.slug] && <p className={styles.error} role="alert">{errors[item.slug]}</p>}
                    </div>
                    <div className={styles.stepper} role="group" aria-label={`Количество «${item.name}»`}>
                      <button type="button" aria-label="Меньше" onClick={() => update(item, item.qty - 1)}>{item.qty === 1 ? "×" : "−"}</button>
                      <output>{item.qty}</output>
                      <button type="button" aria-label="Больше" disabled={item.qty >= Math.min(MAX_QTY_PER_DREAM, inStock)} onClick={() => update(item, item.qty + 1)}>+</button>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      <div className={styles.summary}>
        <span>Итого</span>
        <b>{cart.total}</b>
      </div>
      <Link href="/app/checkout" className={styles.primary}>Оформить</Link>
      <button type="button" className={styles.secondary} onClick={() => changeCart(api.clearCart)}>Очистить корзину</button>
    </>
  );
}
