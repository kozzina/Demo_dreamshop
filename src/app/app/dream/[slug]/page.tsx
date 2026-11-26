import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CATALOG, coverPath, findDream } from "@/domain/catalog";
import { formatUsd } from "@/domain/money";
import { dreamBlurbs, dreamDetails } from "@/server/knowledge";
import { BuyBar } from "@/ui/components/BuyBar";
import { Icon } from "@/ui/components/Icon";
import { SimilarDreams } from "@/ui/components/SimilarDreams";
import { PRINCIPLES } from "@/ui/content";
import { minutesLabel, typo } from "@/ui/format";
import { StockFact } from "./StockFact";
import styles from "./dream.module.css";

export const generateStaticParams = () => CATALOG.map((dream) => ({ slug: dream.slug }));

/**
 * Dream page: every text comes from the knowledge base, stock and cart from the API.
 * The back link is the shared shell; everything that depends on the slug streams in behind Suspense.
 */
export default function DreamPage({ params }: PageProps<"/app/dream/[slug]">) {
  return (
    <article className={styles.dream}>
      <div className={styles.overlay}>
        <Link href="/app" className={styles.round} aria-label="Назад в каталог">
          <Icon name="back" size={20} />
        </Link>
        <span className={styles.demo}>Демо</span>
      </div>
      <Suspense fallback={<div className={styles.cover} aria-hidden />}>
        <DreamDetails params={params} />
      </Suspense>
    </article>
  );
}

async function DreamDetails({ params }: Pick<PageProps<"/app/dream/[slug]">, "params">) {
  const { slug } = await params;
  const dream = findDream(slug);
  const details = dream && dreamDetails(dream.slug);
  if (!dream || !details) notFound();
  const feelings = details.feelings?.replace(/\.$/, "").split(/,\s*/) ?? [];

  return (
    <>
      <div className={styles.cover}>
        <Image src={coverPath(dream.slug)} alt="" fill sizes="(max-width: 640px) 100vw, 640px" preload loading="eager" />
      </div>

      <div className={styles.intro}>
        <p className={styles.genre}>{dream.genre}</p>
        <h1 className={styles.name}>{typo(dream.name.ru)}</h1>
        {details.mood.length > 0 && (
          <ul className={styles.moods} aria-label="Настроение">
            {details.mood.map((mood) => (
              <li key={mood}>{mood}</li>
            ))}
          </ul>
        )}
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Длится</dt>
          <dd>{dream.wholeNight ? "Всю ночь" : minutesLabel(dream.minutes)}</dd>
        </div>
        <div>
          <dt>Возраст</dt>
          <dd>{dream.age}</dd>
        </div>
        <StockFact slug={dream.slug} />
      </dl>

      <blockquote className={styles.teaser}>{typo(details.teaser)}</blockquote>

      {details.scenes.length > 0 && (
        <section className={styles.section}>
          <h2>{dream.wholeNight ? "Что внутри" : "Как пройдёт сон"}</h2>
          <ol className={styles.scenes}>
            {details.scenes.map((scene) => (
              <li key={scene}>{typo(scene)}</li>
            ))}
          </ol>
        </section>
      )}

      {feelings.length > 0 && (
        <section className={styles.section}>
          <h2>Ощущения</h2>
          <ul className={styles.feelings}>
            {feelings.map((feeling) => (
              <li key={feeling}>{feeling}</li>
            ))}
          </ul>
        </section>
      )}

      {(details.goodFor || details.notFor) && (
        <section className={styles.fit}>
          {details.goodFor && (
            <div className={styles.fitCard}>
              <h2>
                <Icon name="check" size={18} />
                Подходит
              </h2>
              <p>{typo(details.goodFor)}</p>
            </div>
          )}
          {details.notFor && (
            <div className={styles.fitCard} data-kind="not">
              <h2>
                <Icon name="close" size={16} />
                Не подходит
              </h2>
              <p>{typo(details.notFor)}</p>
            </div>
          )}
        </section>
      )}

      {details.notes && (
        <section className={styles.section}>
          <h2>Важно знать</h2>
          <p className={styles.notes}>{typo(details.notes)}</p>
        </section>
      )}

      <ul className={styles.promise} aria-label="Гарантии мастерской">
        {PRINCIPLES.map((principle) => (
          <li key={principle}>
            <Icon name="shield" size={18} />
            {principle}
          </li>
        ))}
      </ul>

      <SimilarDreams slug={dream.slug} blurbs={dreamBlurbs()} />

      <BuyBar slug={dream.slug} name={dream.name.ru} price={formatUsd(dream.price)} />
    </>
  );
}
