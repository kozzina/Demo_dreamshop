"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { CatalogItem } from "@/shared/contract";
import { Icon } from "@/ui/components/Icon";
import { minutesLabel } from "@/ui/format";
import { MOODS } from "@/ui/moods";
import { useShop } from "@/ui/shop-context";
import styles from "./catalog.module.css";

const SKELETON_CARDS = 4;
/** Stock at or below this shows «Осталось N» on the card. */
const LOW_STOCK = 2;

export default function CatalogPage() {
  const { catalog, ready } = useShop();
  const [mood, setMood] = useState("all");
  const filter = MOODS.find((m) => m.id === mood) ?? MOODS[0];
  const dreams = catalog.filter(filter.match);

  return (
    <>
      <p className={styles.eyebrow}>Сны на любую ночь</p>
      <h1 className={styles.title}>Какой сон сегодня?</h1>

      <div className={styles.chips} role="group" aria-label="Подбор по настроению">
        {MOODS.map((m) => (
          <button key={m.id} type="button" className={styles.chip} aria-pressed={m.id === mood} onClick={() => setMood(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <ul className={styles.grid} aria-busy={!ready}>
        {!ready &&
          Array.from({ length: SKELETON_CARDS }, (_, i) => (
            <li key={i} className={styles.skeleton} aria-hidden />
          ))}
        {dreams.map((dream, i) => (
          <li key={dream.slug} className={i === 0 && mood === "all" ? styles.featured : undefined} style={{ "--i": i } as CSSProperties}>
            <DreamCard dream={dream} featured={i === 0 && mood === "all"} />
          </li>
        ))}
      </ul>
      {!ready && <p className="visually-hidden" role="status">Загружаем каталог…</p>}
    </>
  );
}

function DreamCard({ dream, featured }: { dream: CatalogItem; featured: boolean }) {
  const soldOut = dream.inStock === 0;
  return (
    <Link href={`/app/dream/${dream.slug}`} className={styles.card} data-sold-out={soldOut || undefined}>
      <span className={styles.cover}>
        <Image src={dream.cover} alt="" fill sizes={featured ? "(max-width: 640px) 100vw, 608px" : "(max-width: 640px) 50vw, 300px"} preload={featured} />
        {soldOut && <span className={styles.badge}>Нет в наличии</span>}
        {!soldOut && dream.inStock <= LOW_STOCK && <span className={styles.badge}>Осталось {dream.inStock}</span>}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{dream.name.ru}</span>
        <span className={styles.meta}>
          <Icon name="clock" size={14} />
          {minutesLabel(dream.minutes)} · {dream.age}
        </span>
        <span className={styles.price}>{dream.price}</span>
      </span>
    </Link>
  );
}
