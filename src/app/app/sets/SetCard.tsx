"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { coverPath, findDream } from "@/domain/catalog";
import { api } from "@/ui/api";
import { Icon } from "@/ui/components/Icon";
import type { DreamSet } from "@/ui/content";
import { errorMessage, minutesLabel, nightLabel, typo } from "@/ui/format";
import { planSet } from "@/ui/plan-set";
import { useBookableNights } from "@/ui/use-bookable-nights";
import { useShop } from "@/ui/shop-context";
import { haptic } from "@/ui/telegram";
import styles from "./sets.module.css";

type Message = { kind: "ok" | "error"; text: string };

export function SetCard({ set, total, moods }: { set: DreamSet; total: string; moods: string[] }) {
  const { cart, catalog, changeCart, ready } = useShop();
  const nights = useBookableNights();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const soldOut = set.dreams.some((slug) => catalog.find((d) => d.slug === slug)?.inStock === 0);

  async function add() {
    const plan = planSet(cart.items, set.dreams, nights);
    if (!plan) return setMessage({ kind: "error", text: "В ближайшие 30 ночей нет двух свободных подряд." });
    setBusy(true);
    setMessage(null);
    for (const [i, slug] of set.dreams.entries()) {
      const error = await changeCart(() => api.addToCart(slug, 1, plan[i]));
      if (error) {
        haptic("error");
        setBusy(false);
        return setMessage({ kind: "error", text: errorMessage(error) });
      }
    }
    haptic("success");
    setBusy(false);
    setMessage({ kind: "ok", text: `В корзине: ${plan.map((night) => nightLabel(night).toLowerCase()).join(" и ")}` });
  }

  return (
    <article className={styles.card}>
      <div className={styles.covers} aria-hidden>
        {set.dreams.map((slug) => (
          <span key={slug} className={styles.cover}>
            <Image src={coverPath(slug)} alt="" fill sizes="(max-width: 640px) 50vw, 300px" />
          </span>
        ))}
        <span className={styles.nights}>
          <Icon name="calendar" size={14} />2 ночи
        </span>
      </div>
      <div className={styles.body}>
        <h2>{set.name}</h2>
        <p className={styles.pitch}>{typo(set.pitch)}</p>
        <ol className={styles.dreams}>
          {set.dreams.map((slug, i) => {
            const dream = findDream(slug)!;
            return (
              <li key={slug}>
                <span className={styles.step}>{i + 1}</span>
                <Link href={`/app/dream/${slug}`}>{dream.name.ru}</Link>
                <span className={styles.dreamMeta}>
                  {moods[i]} · {dream.wholeNight ? "вся ночь" : minutesLabel(dream.minutes)}
                </span>
              </li>
            );
          })}
        </ol>
        <div className={styles.buy}>
          <span className={styles.total}>{total}</span>
          <button type="button" className={styles.add} disabled={busy || !ready || soldOut} onClick={add}>
            {soldOut ? "Нет в наличии" : busy ? "Добавляем…" : "Добавить набор"}
          </button>
        </div>
        <p className={message?.kind === "error" ? styles.error : styles.ok} role="status">
          {message?.kind === "ok" && (
            <>
              <Icon name="check" size={18} />
              <span>
                {message.text} · <Link href="/app/cart">Корзина</Link>
              </span>
            </>
          )}
          {message?.kind === "error" && message.text}
        </p>
      </div>
    </article>
  );
}
