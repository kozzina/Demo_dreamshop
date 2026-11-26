"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { VERA_PROMPTS } from "../content";
import { canReturnToChat, returnToChat } from "../telegram";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import styles from "./VeraSheet.module.css";

const subscribeNever = () => () => {};

/**
 * Vera, the shop assistant. Until she is connected here, the quick asks open the matching
 * selection; inside Telegram the buyer can also go back to the chat with her.
 */
export function VeraSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inTelegram = useSyncExternalStore(subscribeNever, canReturnToChat, () => false);
  return (
    <Sheet open={open} onClose={onClose} title="Вера">
      <div className={styles.intro}>
        <span className={styles.avatar}>
          <Icon name="sparkle" size={26} />
        </span>
        <p>
          Я Вера, AI-ассистент магазина. Расскажите, какой сон хочется, — подберу и{" "}положу в{" "}корзину.
        </p>
      </div>
      <p className={styles.label}>С чего начнём?</p>
      <ul className={styles.prompts}>
        {VERA_PROMPTS.map((prompt) => (
          <li key={prompt.label}>
            <Link href={prompt.href} onClick={onClose}>
              {prompt.label}
              <Icon name="arrow" size={16} />
            </Link>
          </li>
        ))}
      </ul>
      {inTelegram && (
        <button type="button" className={styles.chat} onClick={returnToChat}>
          <Icon name="chat" size={20} />
          Написать Вере в чат
        </button>
      )}
    </Sheet>
  );
}
