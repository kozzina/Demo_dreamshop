"use client";

import { useSyncExternalStore } from "react";
import { hoodOn, setHood, subscribeHood } from "@/ui/hood";
import styles from "./case.module.css";

/** Shows the assistant's tool calls between chat replies in the buyer phone. */
export function HoodToggle() {
  const on = useSyncExternalStore(subscribeHood, hoodOn, () => false);
  return (
    <label className={styles.toggle}>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => setHood(e.target.checked)} />
      <span className={styles.track} aria-hidden />
      Показать, как работает
    </label>
  );
}
