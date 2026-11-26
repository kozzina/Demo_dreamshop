"use client";

import { nightParts } from "../format";
import styles from "./NightPicker.module.css";

/** A strip of bookable nights. A native radio group, so arrows, focus and screen readers just work. */
export function NightPicker({ name, nights, value, onChange }: { name: string; nights: string[]; value: string | undefined; onChange: (night: string) => void }) {
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>Ночь</legend>
      <div className={styles.strip}>
        {nights.map((night) => {
          const { day, date } = nightParts(night);
          return (
            <label key={night} className={styles.night}>
              <input type="radio" name={name} value={night} checked={night === value} onChange={() => onChange(night)} />
              <span className={styles.day}>{day}</span>
              <span className={styles.date}>{date}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
