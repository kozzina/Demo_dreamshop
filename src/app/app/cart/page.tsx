"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MAX_DREAMS_PER_NIGHT, MAX_MINUTES_PER_NIGHT, MAX_QTY_PER_DREAM, nightLoad } from "@/domain/cart";
import { coverPath } from "@/domain/catalog";
import type { CartItem } from "@/shared/contract";
import { api } from "@/ui/api";
import { EmptyState } from "@/ui/components/EmptyState";
import { Icon } from "@/ui/components/Icon";
import { Stepper } from "@/ui/components/Stepper";
import { TopBar } from "@/ui/components/TopBar";
import { errorMessage, minutesLabel, nightParts, plural, shortNightLabel } from "@/ui/format";
import { useBookableNights } from "@/ui/use-bookable-nights";
import { useShop } from "@/ui/shop-context";
import { haptic } from "@/ui/telegram";
import styles from "./cart.module.css";

export default function CartPage() {
  const { cart, changeCart, ready, cartCount } = useShop();
  const [confirmClear, setConfirmClear] = useState(false);

  if (ready && cart.items.length === 0) {
    return (
      <>
        <TopBar title="Корзина" />
        <EmptyState icon="bag" title="Корзина пуста" text="Выберите сон в каталоге или попросите Веру подобрать." action={{ href: "/app", label: "В каталог" }} />
      </>
    );
  }

  const nights = [...new Set(cart.items.map((item) => item.night))].sort();

  async function clear() {
    if (!confirmClear) return setConfirmClear(true);
    await changeCart(api.clearCart);
    setConfirmClear(false);
  }

  return (
    <>
      <TopBar title="Корзина" />
      <p className={styles.lead}>
        {cartCount} {plural(cartCount, ["сон", "сна", "снов"])} на {nights.length} {plural(nights.length, ["ночь", "ночи", "ночей"])}
      </p>

      {nights.map((night) => (
        <NightCard key={night} night={night} items={cart.items.filter((item) => item.night === night)} />
      ))}

      <button type="button" className={styles.clear} onClick={clear} onBlur={() => setConfirmClear(false)}>
        {confirmClear ? "Точно очистить? Нажмите ещё раз" : "Очистить корзину"}
      </button>

      <div className={styles.summary}>
        <div>
          <span className={styles.totalLabel}>Итого</span>
          <b className={styles.total}>{cart.total}</b>
        </div>
        <Link href="/app/checkout" className={styles.primary}>
          Оформить
          <Icon name="arrow" size={18} />
        </Link>
      </div>
    </>
  );
}

/** One night: how full it is against the rules, and its dreams. */
function NightCard({ night, items }: { night: string; items: CartItem[] }) {
  const { cart } = useShop();
  const load = nightLoad(cart.items, night);
  const { day, date } = nightParts(night);
  return (
    <section className={styles.night} aria-labelledby={`night-${night}`}>
      <header className={styles.nightHead}>
        <span className={styles.nightIcon}>
          <Icon name="moon" size={18} />
        </span>
        <h2 id={`night-${night}`}>
          {day}
          <span>{date}</span>
        </h2>
        <span className={styles.load}>
          {load.wholeNight ? "Занята целиком" : `${load.dreams} из ${MAX_DREAMS_PER_NIGHT} снов · ${minutesLabel(load.minutes)} из 6 ч`}
        </span>
      </header>
      <div className={styles.meter} aria-hidden>
        <span style={{ width: `${load.wholeNight ? 100 : Math.min(100, (load.minutes / MAX_MINUTES_PER_NIGHT) * 100)}%` }} />
      </div>
      <ul>
        {items.map((item) => (
          <CartLine key={item.slug} item={item} />
        ))}
      </ul>
    </section>
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
        <Image src={coverPath(item.slug)} alt="" fill sizes="64px" />
      </Link>
      <div className={styles.info}>
        <Link href={`/app/dream/${item.slug}`} className={styles.name}>{item.name}</Link>
        <span className={styles.price}>{item.price} за шт.</span>
        <div className={styles.controls}>
          <label className={styles.select}>
            <span className="visually-hidden">Ночь для «{item.name}»</span>
            <select value={item.night} onChange={(e) => update(item.qty, e.target.value)}>
              {bookable.map((n) => (
                <option key={n} value={n}>{shortNightLabel(n)}</option>
              ))}
            </select>
          </label>
          <Stepper label={`Количество «${item.name}»`} value={item.qty} min={1} max={Math.min(MAX_QTY_PER_DREAM, inStock)} onChange={(qty) => update(qty)} removeAtMin />
        </div>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </li>
  );
}
