import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { CatalogItem, DreamBlurb } from "@/shared/contract";
import { BADGES } from "../content";
import { minutesLabel } from "../format";
import styles from "./DreamCard.module.css";

/** Stock at or below this shows «Осталось N» instead of the dream's own label. */
const LOW_STOCK = 2;

function coverLabel(dream: CatalogItem): string | undefined {
  if (dream.inStock === 0) return "Нет в наличии";
  if (dream.inStock <= LOW_STOCK) return `Осталось ${dream.inStock}`;
  return BADGES[dream.slug];
}

/**
 * A dream in a list. `featured` is the wide first card with the teaser;
 * `row` is the compact horizontal card used for similar dreams and sets.
 */
export function DreamCard({ dream, blurb, variant = "grid", index = 0 }: { dream: CatalogItem; blurb?: DreamBlurb; variant?: "featured" | "grid" | "row"; index?: number }) {
  const label = coverLabel(dream);
  const soldOut = dream.inStock === 0;
  return (
    <Link
      href={`/app/dream/${dream.slug}`}
      className={`${styles.card} ${styles[variant]}`}
      data-sold-out={soldOut || undefined}
      style={{ "--i": index } as CSSProperties}
    >
      <span className={styles.cover}>
        <Image
          src={dream.cover}
          alt=""
          fill
          sizes={variant === "featured" ? "(max-width: 640px) 100vw, 608px" : variant === "row" ? "96px" : "(max-width: 640px) 50vw, 300px"}
          preload={variant === "featured"}
        />
        {label && variant !== "row" && <span className={styles.label} data-alert={soldOut || dream.inStock <= LOW_STOCK || undefined}>{label}</span>}
      </span>
      <span className={styles.body}>
        {blurb && blurb.mood.length > 0 && <span className={styles.mood}>{blurb.mood.slice(0, variant === "featured" ? 3 : 1).join(" · ")}</span>}
        <span className={styles.name}>{dream.name.ru}</span>
        {variant === "featured" && blurb && <span className={styles.teaser}>{blurb.teaser}</span>}
        <span className={styles.meta}>
          <span>
            {dream.wholeNight ? "Вся ночь" : minutesLabel(dream.minutes)} · {dream.age}
          </span>
          <b className={styles.price}>{dream.price}</b>
        </span>
      </span>
    </Link>
  );
}
