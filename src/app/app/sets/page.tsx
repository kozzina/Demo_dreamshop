import { findDream } from "@/domain/catalog";
import { formatUsd, sum } from "@/domain/money";
import { dreamBlurbs } from "@/server/knowledge";
import { TopBar } from "@/ui/components/TopBar";
import { SETS } from "@/ui/content";
import { typo } from "@/ui/format";
import { SetCard } from "./SetCard";
import styles from "./sets.module.css";

/** Sets from the knowledge base (section 5): two dreams on two nights, priced as the sum of the dreams. */
export default function SetsPage() {
  const blurbs = dreamBlurbs();
  return (
    <>
      <TopBar title="Наборы" back={{ href: "/app", label: "В каталог" }} />
      <p className={styles.lead}>{typo("Два сна на две ночи подряд. Цена — сумма снов, без наценки. Удобно в подарок.")}</p>
      <ul className={styles.list}>
        {SETS.map((set) => (
          <li key={set.id}>
            <SetCard
              set={set}
              total={formatUsd(sum(set.dreams.map((slug) => findDream(slug)!.price)))}
              moods={set.dreams.map((slug) => blurbs[slug].mood[0] ?? "")}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
