"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/ui/api";
import { EmptyState } from "@/ui/components/EmptyState";
import { Icon } from "@/ui/components/Icon";
import { errorMessage, nightLabel, typo } from "@/ui/format";
import { useShop } from "@/ui/shop-context";
import { haptic } from "@/ui/telegram";
import styles from "./checkout.module.css";

/** The demo never asks for personal or payment details: the order data is fictional and shown as text. */
const DEMO_DETAILS = [
  { label: "Покупатель", value: "Вымышленный покупатель" },
  { label: "Доставка", value: "Во сне, в выбранную ночь — бесплатно" },
  { label: "Оплата", value: "Демо: деньги не списываются" },
] as const;

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
    return <EmptyState icon="bag" title="Нечего оформлять" text="Корзина пуста — выберите сон в каталоге." action={{ href: "/app", label: "В каталог" }} />;
  }

  return (
    <>
      <Link href="/app/cart" className={styles.back}>
        <Icon name="back" size={18} />
        Корзина
      </Link>
      <h1 className={styles.title}>Оформление</h1>

      <section className={styles.card} aria-labelledby="checkout-items">
        <h2 id="checkout-items">Ваш заказ</h2>
        <ul className={styles.items}>
          {cart.items.map((item) => (
            <li key={item.slug}>
              <span className={styles.itemName}>
                {item.name}
                {item.qty > 1 && <span className={styles.qty}> × {item.qty}</span>}
              </span>
              <span className={styles.itemNight}>{nightLabel(item.night)}</span>
            </li>
          ))}
        </ul>
        <div className={styles.total}>
          <span>Итого</span>
          <b>{cart.total}</b>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="checkout-details">
        <h2 id="checkout-details">
          Данные заказа <span className={styles.demoTag}>заполнены за вас</span>
        </h2>
        <dl className={styles.details}>
          {DEMO_DETAILS.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="button" className={styles.pay} disabled={busy || !ready} onClick={pay}>
        {busy ? "Оформляем…" : `Оплатить ${cart.total}`}
      </button>
      <p className={styles.note}>{typo("Это демо: свои данные вводить не нужно, оплата не настоящая.")}</p>
    </>
  );
}
