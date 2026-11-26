"use client";

import type { DreamSlug } from "@/domain/catalog";
import type { DreamBlurb } from "@/shared/contract";
import { similarDreams } from "../moods";
import { useShop } from "../shop-context";
import { DreamCard } from "./DreamCard";
import styles from "./SimilarDreams.module.css";

/** «Похожие сны»: dreams that share an occasion, with live stock. Sold-out ones are left out. */
export function SimilarDreams({ slug, blurbs }: { slug: DreamSlug; blurbs: Partial<Record<DreamSlug, DreamBlurb>> }) {
  const { catalog } = useShop();
  const dreams = similarDreams(slug)
    .map((other) => catalog.find((dream) => dream.slug === other))
    .filter((dream) => dream && dream.inStock > 0);
  if (dreams.length === 0) return null;
  return (
    <section className={styles.similar} aria-labelledby="similar-title">
      <h2 id="similar-title">Похожие сны</h2>
      <ul>
        {dreams.map((dream) => dream && (
          <li key={dream.slug}>
            <DreamCard dream={dream} blurb={blurbs[dream.slug]} variant="row" />
          </li>
        ))}
      </ul>
    </section>
  );
}
