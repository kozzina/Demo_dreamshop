"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import type { ChatLine } from "@/shared/contract";
import { api } from "../api";
import { ASSISTANT_PROMPTS } from "../content";
import { useShop } from "../shop-context";
import { canReturnToChat, returnToChat } from "../telegram";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import styles from "./AssistantSheet.module.css";

const subscribeNever = () => () => {};
const GREETING = "Я Соня, AI-ассистент магазина. Расскажите, какой сон хочется, — подберу и положу в корзину.";

/**
 * Sonya. Inside Telegram she lives in the bot chat, so the sheet sends the buyer there and keeps
 * quick selections. On the site the sheet is the chat itself, on the same API and the same sandbox.
 */
export function AssistantSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inTelegram = useSyncExternalStore(subscribeNever, canReturnToChat, () => false);
  return (
    <Sheet open={open} onClose={onClose} title="Соня">
      {inTelegram ? <TelegramHint onClose={onClose} /> : <Chat open={open} />}
    </Sheet>
  );
}

function Intro() {
  return (
    <div className={styles.intro}>
      <span className={styles.avatar}>
        <Icon name="sparkle" size={26} />
      </span>
      <p>{GREETING}</p>
    </div>
  );
}

function TelegramHint({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Intro />
      <button type="button" className={styles.chatButton} onClick={returnToChat}>
        <Icon name="chat" size={20} />
        Написать Соне в чат
      </button>
      <p className={styles.label}>Или откройте подборку</p>
      <ul className={styles.prompts}>
        {ASSISTANT_PROMPTS.map((prompt) => (
          <li key={prompt.label}>
            <Link href={prompt.href} onClick={onClose}>
              {prompt.label}
              <Icon name="arrow" size={16} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Chat({ open }: { open: boolean }) {
  const { refresh, ready } = useShop();
  const [lines, setLines] = useState<ChatLine[] | null>(null);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !ready || lines !== null) return;
    api.chat().then((result) => setLines(result.ok ? result.data : []));
  }, [open, ready, lines]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [lines, thinking]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    setDraft("");
    setLines((prev) => [...(prev ?? []), { role: "buyer", text: clean }]);
    setThinking(true);
    const result = await api.sendChat(clean);
    setThinking(false);
    const answers = result.ok ? result.data.messages : ["Не получилось отправить. Проверьте связь и попробуйте ещё раз."];
    setLines((prev) => [...(prev ?? []), ...answers.map((answer) => ({ role: "assistant" as const, text: answer }))]);
    if (result.ok && result.data.changed) await refresh();
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  return (
    <div className={styles.chat}>
      <div className={styles.log} aria-live="polite">
        <Intro />
        {lines?.map((line, i) => (
          <p key={i} className={line.role === "buyer" ? styles.buyer : styles.sonya}>
            {line.text}
          </p>
        ))}
        {thinking && (
          <p className={`${styles.sonya} ${styles.typing}`} aria-label="Соня печатает">
            <span />
            <span />
            <span />
          </p>
        )}
        <div ref={end} />
      </div>

      {lines !== null && lines.length === 0 && !thinking && (
        <ul className={styles.chips}>
          {ASSISTANT_PROMPTS.map((prompt) => (
            <li key={prompt.label}>
              <button type="button" onClick={() => send(prompt.label)}>
                {prompt.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className={styles.composer} onSubmit={submit}>
        <label className="visually-hidden" htmlFor="sonya-input">
          Сообщение Соне
        </label>
        <input
          id="sonya-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Какой сон хочется?"
          maxLength={2000}
          autoComplete="off"
          enterKeyHint="send"
        />
        <button type="submit" aria-label="Отправить" disabled={!draft.trim() || thinking}>
          <Icon name="arrow" size={20} />
        </button>
      </form>
      <p className={styles.note}>Соня — AI-ассистент. До 20 сообщений в день.</p>
    </div>
  );
}
