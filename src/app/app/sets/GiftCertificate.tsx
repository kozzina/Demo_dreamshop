"use client";

import { useState } from "react";
import { CERTIFICATE_AMOUNTS, CERTIFICATE_VALID_MONTHS } from "@/domain/certificates";
import { formatUsd, type Cents } from "@/domain/money";
import { api } from "@/ui/api";
import { Icon } from "@/ui/components/Icon";
import { errorMessage, typo } from "@/ui/format";
import { useShop } from "@/ui/shop-context";
import { haptic } from "@/ui/telegram";
import styles from "./gift.module.css";

type State = { kind: "idle" } | { kind: "busy" } | { kind: "sent"; amount: string } | { kind: "error"; text: string };

/** A gift certificate request: the manager issues it, so the button sends a request to the manager feed. */
export function GiftCertificate() {
  const { ready } = useShop();
  const [amount, setAmount] = useState<Cents>(CERTIFICATE_AMOUNTS[1]);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function send() {
    setState({ kind: "busy" });
    const result = await api.requestCertificate(amount);
    haptic(result.ok ? "success" : "error");
    setState(result.ok ? { kind: "sent", amount: formatUsd(amount) } : { kind: "error", text: errorMessage(result.error) });
  }

  return (
    <section id="gift" className={styles.gift} aria-labelledby="gift-title">
      <span className={styles.ribbon} aria-hidden />
      <p className={styles.eyebrow}>В подарок</p>
      <h2 id="gift-title">Подарочный сертификат</h2>
      <p className={styles.text}>{typo(`Получатель сам выберет сон и ночь. Действует ${CERTIFICATE_VALID_MONTHS} месяцев, оформляет менеджер.`)}</p>

      <fieldset className={styles.amounts} disabled={state.kind === "busy"}>
        <legend className="visually-hidden">Номинал</legend>
        {CERTIFICATE_AMOUNTS.map((value) => (
          <label key={value} className={styles.amount}>
            <input type="radio" name="certificate" checked={amount === value} onChange={() => setAmount(value)} />
            {formatUsd(value)}
          </label>
        ))}
      </fieldset>

      {state.kind === "sent" ? (
        <p className={styles.sent} role="status">
          <Icon name="check" size={20} />
          <span>{typo(`Заявка на ${state.amount} у менеджера — она уже в его ленте.`)}</span>
        </p>
      ) : (
        <button type="button" className={styles.send} disabled={!ready || state.kind === "busy"} onClick={send}>
          {state.kind === "busy" ? "Отправляем…" : "Оформить сертификат"}
        </button>
      )}
      {state.kind === "error" && (
        <p className={styles.error} role="alert">
          {state.text}
        </p>
      )}
      <p className={styles.note}>Также любой сон или набор можно подарить: открытка с тизером сна бесплатно.</p>
    </section>
  );
}
