"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { minutesLabel } from "@/ui/format";
import { MOODS } from "@/ui/moods";
import { useShop } from "@/ui/shop-context";
import styles from "./catalog.module.css";

export default function CatalogPage() {
  const { catalog, ready } = useShop();
  const [mood, setMood] = useState("all");
  const filter = MOODS.find((m) => m.id === mood) ?? MOODS[0];
  const dreams = catalog.filter(filter.match);

  return (
    <>
      <h1 className={styles.title}>Какой сон сегодня?</h1>
      <div className={styles.chips} role="group" aria-label="Подбор по настроению">
        {MOODS.map((m) => (
          <button key={m.id} type="button" className={styles.chip} aria-pressed={m.id === mood} onClick={() => setMood(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {!ready && <p className={styles.hint}>Загружаем каталог…</p>}

      <ul className={styles.grid}>
        {dreams.map((dream) => (
          <li key={dream.slug}>
            <Link href={`/app/dream/${dream.slug}`} className={styles.card} aria-disabled={dream.inStock === 0}>
              <span className={styles.cover}>
                <Image src={dream.cover} alt="" fill sizes="(max-width: 640px) 50vw, 300px" />
                {dream.inStock === 0 && <span className={styles.badge}>Нет в наличии</span>}
                {dream.inStock > 0 && dream.inStock <= 2 && <span className={styles.badge}>Осталось {dream.inStock}</span>}
              </span>
              <span className={styles.name}>{dream.name.ru}</span>
              <span className={styles.meta}>
                {minutesLabel(dream.minutes)} · {dream.age}
              </span>
              <span className={styles.price}>{dream.price}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
