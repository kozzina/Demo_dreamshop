"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import type { DreamSlug } from "@/domain/catalog";
import type { DreamBlurb } from "@/shared/contract";
import { DreamCard } from "@/ui/components/DreamCard";
import { Icon } from "@/ui/components/Icon";
import { greeting, MOTTO, PRINCIPLES, SETS, STORY } from "@/ui/content";
import { typo } from "@/ui/format";
import { findMood, MOODS } from "@/ui/moods";
import { useShop } from "@/ui/shop-context";
import { useAssistant } from "@/ui/assistant";
import styles from "./home.module.css";

const SKELETON_CARDS = 4;
/** The shop's best seller (knowledge base, 2.2): the «tonight» suggestion on the home screen. */
const TONIGHT_PICK: DreamSlug = "childhood-sea";

const subscribeNever = () => () => {};
/** The greeting depends on the buyer's clock, so it is only known in the browser. */
const useGreeting = () => useSyncExternalStore(subscribeNever, () => greeting(new Date().getHours()), () => "Здравствуйте");

export function CatalogHome({ blurbs }: { blurbs: Record<DreamSlug, DreamBlurb> }) {
  const { catalog, ready } = useShop();
  const { openAssistant } = useAssistant();
  const router = useRouter();
  const pathname = usePathname();
  const mood = findMood(useSearchParams().get("mood"));
  const hello = useGreeting();
  // Sold-out dreams go last: the buyer sees what can be ordered first.
  const dreams = catalog.filter((dream) => mood.slugs.includes(dream.slug)).sort((a, b) => Number(a.inStock === 0) - Number(b.inStock === 0));
  const showFeatured = mood.id === "all";
  // Wide cards: the first one on the full list, and a last one left alone in its row.
  const isWide = (i: number) => (showFeatured && i === 0) || (i === dreams.length - 1 && (dreams.length - (showFeatured ? 1 : 0)) % 2 === 1);
  const pick = catalog.find((dream) => dream.slug === TONIGHT_PICK);

  const chooseMood = (id: string) => router.replace(id === "all" ? pathname : `${pathname}?mood=${id}`, { scroll: false });

  return (
    <>
      <header className={styles.header}>
        <span className={styles.brand}>
          <span className={styles.logo}>
            <Icon name="moon" size={18} />
          </span>
          Магазин снов
        </span>
        <span className={styles.demo}>Демо · товары вымышлены</span>
      </header>

      <section className={styles.hero} aria-labelledby="home-title">
        <p className={styles.hello}>{hello}</p>
        <h1 id="home-title" className={styles.title}>
          Какой сон
          <br />
          приснится сегодня?
        </h1>
      </section>

      <div className={styles.features}>
        <button type="button" className={styles.assistantCard} onClick={openAssistant}>
          <span className={styles.featureIcon}>
            <Icon name="sparkle" size={22} />
          </span>
          <span className={styles.featureTitle}>Подобрать с{"\u00a0"}Соней</span>
          <span className={styles.featureText}>{typo("Расскажите о настроении, а AI\u2011ассистент подберёт сон")}</span>
          <span className={styles.featureAction}>Начать</span>
        </button>
        <Link href="/app/sets" className={styles.smallCard}>
          <span className={styles.featureIcon}>
            <Icon name="layers" size={20} />
          </span>
          <span className={styles.featureTitle}>Наборы и подарки</span>
          <span className={styles.featureText}>{SETS.length} набора и{"\u00a0"}сертификаты</span>
          <Icon name="arrow" size={18} />
        </Link>
        <Link href={`/app/dream/${TONIGHT_PICK}`} className={styles.smallCard}>
          <span className={styles.featureIcon}>
            <Icon name="moon" size={20} />
          </span>
          <span className={styles.featureTitle}>Хит магазина</span>
          <span className={styles.featureText}>{pick ? `${pick.name.ru}, ${pick.price}` : "Море из детства"}</span>
          <Icon name="arrow" size={18} />
        </Link>
      </div>

      <div className={styles.sectionHead}>
        <h2>Поводы</h2>
      </div>
      <div className={styles.chips} role="group" aria-label="Подбор по поводу">
        {MOODS.map((m) => (
          <button key={m.id} type="button" className={styles.chip} aria-pressed={m.id === mood.id} onClick={() => chooseMood(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className={styles.sectionHead}>
        <h2>{mood.id === "all" ? "Все сны" : mood.label}</h2>
        {ready && <span>{dreams.length} в каталоге</span>}
      </div>
      <ul className={styles.grid} aria-busy={!ready}>
        {!ready &&
          Array.from({ length: SKELETON_CARDS }, (_, i) => (
            <li key={i} className={styles.skeleton} aria-hidden />
          ))}
        {dreams.map((dream, i) => (
          <li key={dream.slug} className={isWide(i) ? styles.wide : undefined}>
            <DreamCard dream={dream} blurb={blurbs[dream.slug]} variant={isWide(i) ? "featured" : "grid"} index={i} />
          </li>
        ))}
      </ul>
      {!ready && (
        <p className="visually-hidden" role="status">
          Загружаем каталог…
        </p>
      )}

      <section className={styles.about} aria-labelledby="about-title">
        <p className={styles.aboutEyebrow}>О мастерской</p>
        <h2 id="about-title">{MOTTO}</h2>
        <p>{typo(STORY)}</p>
        <ul>
          {PRINCIPLES.map((principle) => (
            <li key={principle}>
              <Icon name="shield" size={18} />
              {principle}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
