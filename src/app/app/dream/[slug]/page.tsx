import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOG, coverPath, findDream } from "@/domain/catalog";
import { formatUsd } from "@/domain/money";
import { dreamDetails } from "@/server/knowledge";
import { AddToCart } from "@/ui/components/AddToCart";
import { Icon } from "@/ui/components/Icon";
import { minutesLabel, typo } from "@/ui/format";
import styles from "./dream.module.css";

export const generateStaticParams = () => CATALOG.map((dream) => ({ slug: dream.slug }));

/**
 * Dream page: the description comes from the knowledge base, stock and cart from the API.
 * The back link is the shared shell; everything that depends on the slug streams in behind Suspense.
 */
export default function DreamPage({ params }: PageProps<"/app/dream/[slug]">) {
  return (
    <article className={styles.dream}>
      <Link href="/app" className={styles.back} aria-label="Назад в каталог">
        <Icon name="back" size={20} />
      </Link>
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
  const price = formatUsd(dream.price);

  return (
    <>
      <div className={styles.cover}>
        <Image src={coverPath(dream.slug)} alt="" fill sizes="(max-width: 640px) 100vw, 640px" preload loading="eager" />
      </div>
      <p className={styles.genre}>{dream.genre}</p>
      <h1 className={styles.name}>{typo(dream.name.ru)}</h1>
      <ul className={styles.facts} aria-label="Коротко">
        <li>
          <Icon name="clock" size={16} />
          {dream.wholeNight ? "Вся ночь" : minutesLabel(dream.minutes)}
        </li>
        <li>{dream.age}</li>
        <li className={styles.price}>{price}</li>
      </ul>
      <p className={styles.teaser}>{typo(details.teaser)}</p>

      <AddToCart slug={dream.slug} price={price} />

      {details.scenes.length > 0 && (
        <section className={styles.section}>
          <h2>{dream.wholeNight ? "Что внутри" : "Сюжет"}</h2>
          <ol className={styles.scenes}>
            {details.scenes.map((scene) => (
              <li key={scene}>{typo(scene)}</li>
            ))}
          </ol>
        </section>
      )}
      {details.feelings && <Section title="Ощущения" text={details.feelings} />}
      {details.goodFor && <Section title="Кому подходит" text={details.goodFor} />}
      {details.notFor && <Section title="Кому не подходит" text={details.notFor} />}
      {details.notes && <Section title="Важно знать" text={details.notes} />}
    </>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <p>{typo(text)}</p>
    </section>
  );
}
