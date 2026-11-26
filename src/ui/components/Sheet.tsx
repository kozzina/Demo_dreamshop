"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./Sheet.module.css";

/**
 * Bottom sheet on a native <dialog>: focus is trapped, Esc and the backdrop close it,
 * and the page behind stays inert. Controlled: the parent owns `open`.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.head}>
          <span className={styles.grabber} aria-hidden />
          <h2>{title}</h2>
          <button type="button" className={styles.close} aria-label="Закрыть" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
