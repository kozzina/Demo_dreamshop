import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import styles from "./EmptyState.module.css";

/** An empty screen that says what is missing and where to go next. */
export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action: { href: string; label: string } }) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon name={icon} size={28} />
      </span>
      <h1>{title}</h1>
      <p>{text}</p>
      <Link href={action.href} className={styles.action}>{action.label}</Link>
    </div>
  );
}
