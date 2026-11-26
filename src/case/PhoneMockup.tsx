import type { ReactNode } from "react";
import styles from "./PhoneMockup.module.css";

/**
 * A phone frame with a live screen inside (an iframe on this same app). `miniApp` draws Telegram's
 * mini app bar above the screen, as a buyer sees the shop inside Telegram.
 */
export function PhoneMockup({ src, title, label, miniApp = false, children }: { src: string; title: string; label: string; miniApp?: boolean; children?: ReactNode }) {
  return (
    <figure className={styles.figure}>
      <figcaption className={styles.label}>{label}</figcaption>
      <div className={styles.phone}>
        <div className={styles.screen}>
          <div className={styles.status} aria-hidden>
            <span>9:41</span>
            <span className={styles.island} />
            <span className={styles.icons}>
              <i />
              <i />
              <b />
            </span>
          </div>
          {miniApp && (
            <div className={styles.miniBar} aria-hidden>
              <span>Закрыть</span>
              <b>Магазин снов</b>
              <span>•••</span>
            </div>
          )}
          <iframe src={src} title={title} className={styles.frame} loading="lazy" />
        </div>
      </div>
      {children}
    </figure>
  );
}
