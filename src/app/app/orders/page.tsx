"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type CSSProperties } from "react";
import { coverPath } from "@/domain/catalog";
import { ORDER_STATUSES } from "@/domain/order";
import type { OrderView } from "@/shared/contract";
import { api } from "@/ui/api";
import { EmptyState } from "@/ui/components/EmptyState";
import { Icon } from "@/ui/components/Icon";
import { nightLabel, STATUS_LABEL } from "@/ui/format";
import styles from "./orders.module.css";

/** Statuses change in the manager feed on the site; the list polls so the buyer sees it live. */
const POLL_MS = 3000;

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const placed = Number(useSearchParams().get("placed"));
  const [orders, setOrders] = useState<OrderView[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const result = await api.orders();
      if (alive && result.ok) setOrders(result.data);
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (orders === null) return <p className={styles.hint} role="status">Загружаем заказы…</p>;
  if (orders.length === 0) {
    return <EmptyState icon="receipt" title="Заказов пока нет" text="Оформленные сны и их статусы появятся здесь." action={{ href: "/app", label: "В каталог" }} />;
  }

  return (
    <>
      <h1 className={styles.title}>Мои заказы</h1>
      {placed > 0 && (
        <p className={styles.placed} role="status">
          <Icon name="check" size={20} />
          <span>
            Заказ №{placed} оформлен. Статус обновляется сам{" "}— можно следить здесь или в{" "}чате бота.
          </span>
        </p>
      )}
      <ul className={styles.list}>
        {orders.map((order) => (
          <OrderCard key={order.number} order={order} highlight={order.number === placed} />
        ))}
      </ul>
    </>
  );
}

function OrderCard({ order, highlight }: { order: OrderView; highlight: boolean }) {
  const cancelled = order.status === "cancelled";
  const step = ORDER_STATUSES.indexOf(order.status as (typeof ORDER_STATUSES)[number]);
  const progress = step < 0 ? 0 : step / (ORDER_STATUSES.length - 1);
  const next = ORDER_STATUSES[step + 1];

  return (
    <li className={styles.order} data-highlight={highlight || undefined}>
      <div className={styles.head}>
        <b>Заказ №{order.number}</b>
        <span className={styles.status} data-status={order.status}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      {!cancelled && (
        <ol className={styles.steps} style={{ "--progress": progress } as CSSProperties} aria-label={`Статус: ${STATUS_LABEL[order.status]}`}>
          {ORDER_STATUSES.map((status, i) => (
            <li key={status} data-done={i <= step || undefined} aria-current={i === step ? "step" : undefined}>
              <span className={styles.dot} aria-hidden />
              <span className="visually-hidden">{STATUS_LABEL[status]}</span>
            </li>
          ))}
        </ol>
      )}
      {!cancelled && (
        <p className={styles.stepNote}>
          Шаг {step + 1} из {ORDER_STATUSES.length}
          {next ? ` · дальше: ${STATUS_LABEL[next].toLowerCase()}` : " · готово"}
        </p>
      )}

      <ul className={styles.items}>
        {order.items.map((item) => (
          <li key={item.slug}>
            <span className={styles.thumb}>
              <Image src={coverPath(item.slug)} alt="" fill sizes="44px" />
            </span>
            <span className={styles.itemText}>
              <span className={styles.itemName}>
                {item.name}
                {item.qty > 1 && ` × ${item.qty}`}
              </span>
              <span className={styles.itemNight}>{nightLabel(item.night)}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.total}>
        <span>Итого</span>
        <b>{order.total}</b>
      </div>
    </li>
  );
}
