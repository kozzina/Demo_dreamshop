"use client";

import { nightParts } from "../format";
import styles from "./NightPicker.module.css";

/**
 * A strip of bookable nights. A native radio group, so arrows, focus and screen readers just work.
 * Nights where the dream would break the night rules are shown as taken and cannot be picked.
 */
export function NightPicker({
  name,
  nights,
  value,
  onChange,
  isTaken = () => false,
}: {
  name: string;
  nights: string[];
  value: string | undefined;
  onChange: (night: string) => void;
  isTaken?: (night: string) => boolean;
}) {
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>Ночь</legend>
      <div className={styles.strip}>
        {nights.map((night) => {
          const { day, date } = nightParts(night);
          const taken = isTaken(night);
          return (
            <label key={night} className={styles.night} data-taken={taken || undefined}>
              <input type="radio" name={name} value={night} checked={night === value} disabled={taken} onChange={() => onChange(night)} />
              <span className={styles.day}>{day}</span>
              <span className={styles.date}>{taken ? "занята" : date}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
