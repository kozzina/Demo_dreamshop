"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/ui/api";
import { errorMessage, nightLabel } from "@/ui/format";
import { useShop } from "@/ui/shop-context";
import { haptic } from "@/ui/telegram";
import styles from "./checkout.module.css";

/** Checkout with fictional, locked data: the demo never asks for real personal or payment details. */
export default function CheckoutPage() {
  const { cart, refresh, ready } = useShop();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    const result = await api.placeOrder();
    if (!result.ok) {
      haptic("error");
      setError(errorMessage(result.error));
      setBusy(false);
      return;
    }
    haptic("success");
    await refresh();
    router.push(`/app/orders?placed=${result.data.number}`);
  }

  if (ready && cart.items.length === 0 && !busy) {
    return (
      <p className={styles.note}>
        Корзина пуста. <Link href="/app">В каталог</Link>
      </p>
    );
  }

  return (
    <>
      <h1 className={styles.title}>Оформление</h1>
      <ul className={styles.items}>
        {cart.items.map((item) => (
          <li key={item.slug}>
            <span>{item.name} × {item.qty}</span>
            <span className={styles.night}>{nightLabel(item.night)}</span>
          </li>
        ))}
      </ul>

      <fieldset className={styles.fields} disabled>
        <legend>Данные заказа</legend>
        <label>Имя<input value="Вымышленный покупатель" readOnly /></label>
        <label>Доставка<input value="Во сне, в выбранную ночь — бесплатно" readOnly /></label>
        <label>Оплата<input value="Демо: деньги не списываются" readOnly /></label>
      </fieldset>
      <p className={styles.note}>В демо данные вымышленные и заполнены заранее — свои вводить не нужно.</p>

      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="button" className={styles.pay} disabled={busy || !ready} onClick={pay}>
        {busy ? "Оформляем…" : `Оплатить ${cart.total} (демо)`}
      </button>
    </>
  );
}
