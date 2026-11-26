"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ORDER_STATUSES } from "@/domain/order";
import type { OrderView } from "@/shared/contract";
import { api } from "@/ui/api";
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

  if (orders === null) return <p className={styles.hint}>Загружаем заказы…</p>;
  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <h1>Заказов пока нет</h1>
        <Link href="/app">В каталог</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className={styles.title}>Мои заказы</h1>
      {placed > 0 && <p className={styles.placed} role="status">Заказ №{placed} оформлен. Статус обновляется сам.</p>}
      <ul className={styles.list}>
        {orders.map((order) => {
          const step = ORDER_STATUSES.indexOf(order.status as (typeof ORDER_STATUSES)[number]);
          return (
            <li key={order.number} className={styles.order} data-highlight={order.number === placed || undefined}>
              <div className={styles.head}>
                <b>№{order.number}</b>
                <span className={styles.status}>{STATUS_LABEL[order.status]}</span>
              </div>
              <ol className={styles.progress} aria-label={`Статус: ${STATUS_LABEL[order.status]}`}>
                {ORDER_STATUSES.map((status, i) => (
                  <li key={status} data-done={i <= step || undefined} title={STATUS_LABEL[status]} />
                ))}
              </ol>
              <ul className={styles.items}>
                {order.items.map((item) => (
                  <li key={item.slug}>
                    {item.name} × {item.qty} <span>· {nightLabel(item.night)}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.total}>{order.total}</div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
