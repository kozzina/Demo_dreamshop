import Link from "next/link";
import { Icon } from "./Icon";
import styles from "./TopBar.module.css";

/** Inner screens: round «back», a centred title and the demo mark, as in the reference. */
export function TopBar({ title, back }: { title: string; back?: { href: string; label: string } }) {
  return (
    <div className={styles.bar}>
      {back ? (
        <Link href={back.href} className={styles.round} aria-label={back.label}>
          <Icon name="back" size={20} />
        </Link>
      ) : (
        <span />
      )}
      <h1 className={styles.title}>{title}</h1>
      <span className={styles.demo} title="Демо на вымышленных данных">Демо</span>
    </div>
  );
}
