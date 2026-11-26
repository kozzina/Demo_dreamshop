import styles from "./Skeleton.module.css";

/**
 * Soft placeholders while data comes from the database: the shape of the real card, a slow
 * lavender shimmer, announced once to screen readers. With reduced motion the shimmer stops.
 */
export function SkeletonCards({ count = 2, label, lines = 3 }: { count?: number; label: string; lines?: number }) {
  return (
    <div className={styles.list} aria-busy>
      <p className="visually-hidden" role="status">
        {label}
      </p>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.card} style={{ animationDelay: `${i * 120}ms` }} aria-hidden>
          <div className={styles.head}>
            <span className={`${styles.block} ${styles.circle}`} />
            <span className={styles.headText}>
              <span className={styles.block} style={{ width: "46%" }} />
              <span className={`${styles.block} ${styles.thin}`} style={{ width: "70%" }} />
            </span>
          </div>
          {Array.from({ length: lines }, (_, j) => (
            <div key={j} className={styles.row}>
              <span className={`${styles.block} ${styles.thumb}`} />
              <span className={styles.headText}>
                <span className={styles.block} style={{ width: `${62 - j * 10}%` }} />
                <span className={`${styles.block} ${styles.thin}`} style={{ width: "38%" }} />
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
