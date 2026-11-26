"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "../shop-context";
import { useVera } from "../vera";
import { Icon, type IconName } from "./Icon";
import styles from "./ShopNav.module.css";

interface Tab {
  href: string;
  label: string;
  icon: IconName;
  active: (pathname: string) => boolean;
}

const LEFT: Tab[] = [
  { href: "/app", label: "Каталог", icon: "moon", active: (p) => p === "/app" || p.startsWith("/app/dream") },
  { href: "/app/sets", label: "Наборы", icon: "layers", active: (p) => p.startsWith("/app/sets") },
];
const RIGHT: Tab[] = [
  { href: "/app/cart", label: "Корзина", icon: "bag", active: (p) => p.startsWith("/app/cart") || p.startsWith("/app/checkout") },
  { href: "/app/orders", label: "Заказы", icon: "receipt", active: (p) => p.startsWith("/app/orders") },
];

/** Floating glass tab bar with Vera in the middle, as in the reference. */
export function ShopNav() {
  const pathname = usePathname();
  const { cartCount } = useShop();
  const { openVera } = useVera();

  const tab = (t: Tab) => (
    <Link key={t.href} href={t.href} className={styles.tab} aria-current={t.active(pathname) ? "page" : undefined}>
      <span className={styles.icon}>
        <Icon name={t.icon} size={22} />
        {t.href === "/app/cart" && cartCount > 0 && (
          <span className={styles.badge}>
            {cartCount}
            <span className="visually-hidden"> в корзине</span>
          </span>
        )}
      </span>
      {t.label}
    </Link>
  );

  return (
    <nav className={styles.nav} aria-label="Разделы магазина">
        <div className={styles.bar}>
          {LEFT.map(tab)}
          <button type="button" className={styles.vera} onClick={openVera} aria-haspopup="dialog">
            <span className={styles.veraButton}>
              <Icon name="sparkle" size={26} />
            </span>
            Вера
          </button>
          {RIGHT.map(tab)}
        </div>
    </nav>
  );
}
