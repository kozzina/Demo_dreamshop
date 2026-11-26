"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cleanSummary, MANAGER_TOPICS, TOPIC_LABEL } from "@/domain/manager-request";
import { nextStatus, type OrderStatus } from "@/domain/order";
import type { FeedEvent, ManagerStats } from "@/shared/contract";
import { api } from "@/ui/api";
import styles from "./manager.module.css";

/** The phone polls for new events: cheaper and simpler than a socket for a demo. */
const POLL_MS = 2000;
const STATS_EVERY = 5;

/** What the manager's button does at each status. Delivery to «delivered» happens at night, by itself. */
const ACTION: Partial<Record<OrderStatus, string>> = {
  new: "Принять",
  accepted: "Собрать",
  assembling: "Передать на доставку",
};

const STATUS_TEXT: Record<OrderStatus, string> = {
  new: "новый",
  accepted: "принят",
  assembling: "собирается",
  delivering: "ждёт ночи",
  delivered: "доставлен",
  cancelled: "отменён",
};

/** Messages the bot shows; status changes and payments update the order message instead of adding new ones. */
const SHOWN: FeedEvent["type"][] = ["order_created", "low_stock", "manager_called"];

const TIME = new Intl.DateTimeFormat("ru", { hour: "2-digit", minute: "2-digit" });
const DAY = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long" });
const NIGHT = new Intl.DateTimeFormat("ru", { day: "numeric", month: "numeric", timeZone: "UTC" });

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  return date.toDateString() === today.toDateString() ? "Сегодня" : DAY.format(date);
}

interface Item {
  name: string;
  qty: number;
  night: string;
}

/**
 * The service bot chat. Every visitor of the demo sees the same feed; the visitor's own orders
 * are marked «Ваш заказ». Buttons move an order one step forward for everyone.
 */
export function ManagerChat() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [statuses, setStatuses] = useState<Record<number, OrderStatus>>({});
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const lastId = useRef(0);
  const end = useRef<HTMLDivElement>(null);

  const absorb = useCallback((fresh: FeedEvent[]) => {
    if (fresh.length === 0) return;
    const oldestFirst = [...fresh].sort((a, b) => a.id - b.id);
    lastId.current = Math.max(lastId.current, oldestFirst[oldestFirst.length - 1].id);
    setStatuses((prev) => {
      const next = { ...prev };
      for (const e of oldestFirst) if (e.orderNumber && e.orderStatus) next[e.orderNumber] = e.orderStatus;
      return next;
    });
    setEvents((prev) => [...prev, ...oldestFirst.filter((e) => SHOWN.includes(e.type) && !prev.some((p) => p.id === e.id))]);
  }, []);

  useEffect(() => {
    let alive = true;
    let tick = 0;
    const load = async () => {
      const result = await api.feed(lastId.current);
      if (!alive) return;
      if (result.ok) absorb(result.data);
      setLoaded(true);
      if (tick++ % STATS_EVERY === 0) {
        const s = await api.managerStats();
        if (alive && s.ok) setStats(s.data);
      }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [absorb]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: loaded ? "smooth" : "auto" });
  }, [events.length, loaded]);

  async function press(number: number, status: OrderStatus) {
    const target = nextStatus(status);
    if (!target) return;
    setBusy(number);
    setStatuses((prev) => ({ ...prev, [number]: target }));
    const result = await api.advanceOrder(number, target);
    // Someone else may have pressed first: the next poll brings the real status.
    if (!result.ok) setStatuses((prev) => ({ ...prev, [number]: status }));
    setBusy(null);
  }

  const days = useMemo(() => {
    const groups: { day: string; items: FeedEvent[] }[] = [];
    for (const e of events) {
      const day = dayLabel(e.createdAt);
      if (groups.at(-1)?.day !== day) groups.push({ day, items: [] });
      groups.at(-1)!.items.push(e);
    }
    return groups;
  }, [events]);

  return (
    <div className={`tg ${styles.tg}`}>
      <header className={styles.header}>
        <span className={styles.back} aria-hidden>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2 2 10l8 8" />
          </svg>
          Чаты
        </span>
        <div className={styles.title}>
          <b>Менеджер · Dream Shop</b>
          <span>{stats ? `бот · сегодня ${stats.ordersToday} заказов на ${stats.totalToday}` : "бот"}</span>
        </div>
        <span className={styles.avatar} aria-hidden>
          DS
        </span>
      </header>

      <main className={styles.chat} aria-live="polite" aria-busy={!loaded}>
        {loaded && events.length === 0 && <p className={styles.service}>Заказов пока нет — оформите первый в магазине слева</p>}
        {days.map((group) => (
          <section key={group.day} className={styles.day}>
            <p className={styles.service}>{group.day}</p>
            {group.items.map((e) => (
              <Message key={e.id} event={e} status={e.orderNumber ? statuses[e.orderNumber] : undefined} busy={busy === e.orderNumber} onPress={press} />
            ))}
          </section>
        ))}
        <div ref={end} />
      </main>

      <footer className={styles.composer}>
        <span className={styles.attach} aria-hidden>
          +
        </span>
        <span className={styles.input}>Только уведомления</span>
      </footer>
    </div>
  );
}

function Message({ event, status, busy, onPress }: { event: FeedEvent; status?: OrderStatus; busy: boolean; onPress: (number: number, status: OrderStatus) => void }) {
  const time = TIME.format(new Date(event.createdAt));
  const p = event.payload;

  if (event.type === "order_created" && event.orderNumber) {
    const items = (p.items as Item[] | undefined) ?? [];
    const action = status ? ACTION[status] : undefined;
    return (
      <div className={styles.message} data-mine={event.mine || undefined}>
        <div className={styles.bubble}>
          {event.mine && <span className={styles.mine}>Ваш заказ</span>}
          <b>Новый заказ №{event.orderNumber}</b>
          <span>{String(p.alias ?? "Покупатель")}</span>
          {items.map((item) => (
            <span key={item.name}>
              «{item.name}» × {item.qty} · ночь {NIGHT.format(new Date(`${item.night}T00:00:00Z`))}
            </span>
          ))}
          <span>
            Итого {String(p.total ?? "")} · оплата прошла <i>(демо)</i>
          </span>
          {status && <span className={styles.status}>Статус: {STATUS_TEXT[status]}</span>}
          <time>{time}</time>
        </div>
        {action && status && (
          <button type="button" className={styles.button} disabled={busy} onClick={() => onPress(event.orderNumber!, status)}>
            {action}
          </button>
        )}
      </div>
    );
  }

  if (event.type === "low_stock") {
    return (
      <div className={styles.message}>
        <div className={styles.bubble}>
          <b>Мало на складе</b>
          <span>
            «{String(p.name)}» — осталось {String(p.left)}
          </span>
          <time>{time}</time>
        </div>
      </div>
    );
  }

  // A neutral one-line summary with a fixed topic, cleaned on the server; cleaned again here
  // for requests stored before topics existed.
  const topic = MANAGER_TOPICS.find((t) => t === p.topic);
  const summary = cleanSummary(String(p.reason ?? ""));
  return (
    <div className={styles.message} data-mine={event.mine || undefined}>
      <div className={styles.bubble}>
        {event.mine && <span className={styles.mine}>Ваш запрос</span>}
        <b>{String(p.alias ?? "Покупатель")} просит менеджера</b>
        {topic && <span className={styles.topic}>Тема: {TOPIC_LABEL[topic]}</span>}
        <span>{summary || "Соня передала вопрос, который не смогла решить сама."}</span>
        <time>{time}</time>
      </div>
    </div>
  );
}
