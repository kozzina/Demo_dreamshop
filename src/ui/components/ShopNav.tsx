"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "../shop-context";
import styles from "./ShopNav.module.css";

const TABS = [
  { href: "/app", label: "Каталог" },
  { href: "/app/cart", label: "Корзина" },
  { href: "/app/orders", label: "Заказы" },
] as const;

export function ShopNav() {
  const pathname = usePathname();
  const { cartCount } = useShop();
  return (
    <nav className={styles.nav} aria-label="Разделы магазина">
      {TABS.map((tab) => {
        const active = tab.href === "/app" ? pathname === "/app" || pathname.startsWith("/app/dream") : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={styles.tab} aria-current={active ? "page" : undefined}>
            {tab.label}
            {tab.href === "/app/cart" && cartCount > 0 && <span className={styles.badge} aria-label={`в корзине ${cartCount}`}>{cartCount}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
