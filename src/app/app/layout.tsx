import type { Metadata, Viewport } from "next";
import { ShopNav } from "@/ui/components/ShopNav";
import { TelegramScript } from "@/ui/components/TelegramScript";
import { ShopProvider } from "@/ui/shop-context";
import styles from "./shop.module.css";

export const metadata: Metadata = { title: "Магазин снов" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

/** The mini app: the same pages run inside Telegram and in the buyer phone on the site. */
export default function ShopLayout({ children }: LayoutProps<"/app">) {
  return (
    <ShopProvider>
      <TelegramScript />
      <div className={styles.shop}>
        <header className={styles.header}>
          <span className={styles.brand}>Магазин снов</span>
          <span className={styles.demo}>Демо · вымышленные товары</span>
        </header>
        <main className={styles.main}>{children}</main>
        <ShopNav />
      </div>
    </ShopProvider>
  );
}
