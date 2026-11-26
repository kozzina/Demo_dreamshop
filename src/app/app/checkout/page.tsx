"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { coverPath } from "@/domain/catalog";
import { api } from "@/ui/api";
import { EmptyState } from "@/ui/components/EmptyState";
import { SkeletonCards } from "@/ui/components/Skeleton";
import { Icon, type IconName } from "@/ui/components/Icon";
import { TopBar } from "@/ui/components/TopBar";
import { errorMessage, nightLabel, typo } from "@/ui/format";
import { useShop } from "@/ui/shop-context";
import { haptic } from "@/ui/telegram";
import styles from "./checkout.module.css";

/** The demo never asks for personal or payment details: the order data is fictional and shown as text. */
const DEMO_DETAILS = [
  { label: "Покупатель", value: "Луна" },
  { label: "Доставка", value: "Во сне · бесплатно" },
  { label: "Оплата", value: "Демо: деньги не списываются" },
] as const;

/** What happens after «Оплатить», in the shop's own words (knowledge base, section 4). */
const NEXT_STEPS: { icon: IconName; text: string }[] = [
  { icon: "receipt", text: "Менеджер примет заказ" },
  { icon: "sparkle", text: "Мастерская настроит сюжет под\u00a0вашу\u00a0ночь" },
  { icon: "moon", text: "Сон придёт, когда вы уснёте" },
];

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

  if (!ready) {
    return (
      <>
        <TopBar title="Оформление" back={{ href: "/app/cart", label: "В корзину" }} />
        <SkeletonCards count={2} lines={2} label="Загружаем заказ…" />
      </>
    );
  }

  if (cart.items.length === 0 && !busy) {
    return (
      <>
        <TopBar title="Оформление" back={{ href: "/app/cart", label: "В корзину" }} />
        <EmptyState icon="bag" title="Нечего оформлять" text="Корзина пуста — выберите сон в каталоге." action={{ href: "/app", label: "В каталог" }} />
      </>
    );
  }

  return (
    <>
      <TopBar title="Оформление" back={{ href: "/app/cart", label: "В корзину" }} />

      <section className={`${styles.card} appear`} aria-labelledby="checkout-items">
        <h2 id="checkout-items">Ваш заказ</h2>
        <ul className={styles.items}>
          {cart.items.map((item) => (
            <li key={item.slug}>
              <span className={styles.thumb}>
                <Image src={coverPath(item.slug)} alt="" fill sizes="48px" />
              </span>
              <span className={styles.itemText}>
                <b>
                  {item.name}
                  {item.qty > 1 && <span className={styles.qty}> × {item.qty}</span>}
                </b>
                <span>
                  <Icon name="moon" size={13} />
                  {nightLabel(item.night)}
                </span>
              </span>
              <span className={styles.itemPrice}>{item.price}</span>
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

      <section className={styles.next} aria-labelledby="checkout-next">
        <h2 id="checkout-next">Что будет дальше</h2>
        <ol>
          {NEXT_STEPS.map((step) => (
            <li key={step.text}>
              <span className={styles.nextIcon}>
                <Icon name={step.icon} size={18} />
              </span>
              {step.text}
            </li>
          ))}
        </ol>
      </section>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="button" className={styles.pay} disabled={busy || !ready} onClick={pay}>
        {busy ? "Оформляем…" : `Оплатить ${cart.total} (демо)`}
      </button>
      <p className={styles.note}>{typo("В демо данные вымышленные, деньги не списываются.")}</p>
    </>
  );
}
