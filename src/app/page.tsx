import type { Metadata } from "next";
import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";
import QRCode from "qrcode";
import { BOT_URL, CODE_URL, CONTACT_URL, HARD_PARTS, HERO, PAINS, PARTS, STACK, VARIANTS } from "@/case/copy";
import { HoodToggle } from "@/case/HoodToggle";
import { PhoneMockup } from "@/case/PhoneMockup";
import { typo } from "@/ui/format";
import styles from "@/case/case.module.css";

const display = Unbounded({ subsets: ["cyrillic", "latin"], weight: ["500", "600"], variable: "--font-display" });
const body = Onest({ subsets: ["cyrillic", "latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["cyrillic", "latin"], weight: ["400"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Магазин в Telegram, который продаёт сам — демо",
  description: HERO.lead,
};

/** The case page: two live phones and what is behind them. Built at deploy time; the phones are live. */
export default async function CasePage() {
  const qr = await QRCode.toString(BOT_URL, { type: "svg", margin: 0, color: { dark: "#0c0d0e", light: "#e6e5e1" } });

  return (
    <div className={`${styles.page} ${display.variable} ${body.variable} ${mono.variable}`}>
      <header className={styles.hero}>
        <p className={styles.tag}>{HERO.tag}</p>
        <h1>{typo(HERO.title)}</h1>
        <p className={styles.lead}>{typo(HERO.lead)}</p>
        <dl className={styles.facts}>
          {HERO.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.value}</dt>
              <dd>{typo(fact.label)}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.note}>{typo(HERO.note)}</p>
      </header>

      <section className={styles.stage} aria-labelledby="demo-title">
        <h2 id="demo-title" className={styles.stageTitle}>
          Закажите сон — заказ появится у&nbsp;менеджера справа
        </h2>
        <div className={styles.phones}>
          <PhoneMockup src="/app" title="Магазин снов: мини-приложение покупателя" label="Покупатель" miniApp />
          <PhoneMockup src="/manager" title="Чат менеджера со служебным ботом" label="Менеджер" />
        </div>
        <div className={styles.controls}>
          <a className={styles.telegram} href={BOT_URL} target="_blank" rel="noreferrer">
            Открыть в своём Telegram
          </a>
          <span className={styles.qr} aria-hidden dangerouslySetInnerHTML={{ __html: qr }} />
          <HoodToggle />
        </div>
        <p className={styles.hint}>{typo("Можно ничего не нажимать в ленте менеджера — через 20 секунд заказ сам перейдёт дальше.")}</p>
      </section>

      <section className={styles.section} aria-labelledby="pain-title">
        <h2 id="pain-title">Ситуация</h2>
        <div>
          <p className={styles.intro}>{typo("Так часто бывает у магазинов и сервисов, которые продают через мессенджеры:")}</p>
          <ul className={styles.pains}>
            {PAINS.map((pain) => (
              <li key={pain}>{typo(pain)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="how-title">
        <h2 id="how-title">Как это устроено</h2>
        <ol className={styles.parts}>
          {PARTS.map((part, i) => (
            <li key={part.name}>
              <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
              <b>{part.name}</b>
              <p>{typo(part.text)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="hard-title">
        <h2 id="hard-title">Сложные места</h2>
        <ul className={styles.hard}>
          {HARD_PARTS.map((item) => (
            <li key={item.problem}>
              <h3>{typo(item.problem)}</h3>
              <p>
                <span>Решение</span>
                {typo(item.solution)}
              </p>
              <p>
                <span>Результат</span>
                {typo(item.result)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="variants-title">
        <h2 id="variants-title">Что можно собрать на этой основе</h2>
        <div>
          <p className={styles.intro}>Вместо снов — то, что продаёте вы:</p>
          <ul className={styles.variants}>
            {VARIANTS.map((variant) => (
              <li key={variant}>{typo(variant)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="stack-title">
        <h2 id="stack-title">Стек</h2>
        <div>
          <ul className={styles.stack}>
            {STACK.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={styles.code}>
            Код демо открыт: <a href={CODE_URL}>github.com/kozzina/Demo_dreamshop</a>
          </p>
        </div>
      </section>

      <footer className={styles.cta}>
        <p>{typo("Нужен такой магазин, запись или бот для заказов? Расскажите, как у вас сейчас.")}</p>
        <a href={CONTACT_URL}>Написать в Telegram</a>
      </footer>
    </div>
  );
}
