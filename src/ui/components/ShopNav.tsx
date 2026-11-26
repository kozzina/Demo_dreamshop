"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "../shop-context";
import { Icon, type IconName } from "./Icon";
import styles from "./ShopNav.module.css";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/app", label: "Каталог", icon: "moon" },
  { href: "/app/cart", label: "Корзина", icon: "bag" },
  { href: "/app/orders", label: "Заказы", icon: "receipt" },
];

const isActive = (href: string, pathname: string) =>
  href === "/app" ? pathname === "/app" || pathname.startsWith("/app/dream") : pathname.startsWith(href);

export function ShopNav() {
  const pathname = usePathname();
  const { cartCount } = useShop();
  return (
    <nav className={styles.nav} aria-label="Разделы магазина">
      <div className={styles.bar}>
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={styles.tab} aria-current={isActive(tab.href, pathname) ? "page" : undefined}>
            <span className={styles.icon}>
              <Icon name={tab.icon} size={22} />
              {tab.href === "/app/cart" && cartCount > 0 && (
                <span className={styles.badge}>
                  {cartCount}
                  <span className="visually-hidden"> в корзине</span>
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
