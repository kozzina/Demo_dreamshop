import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Link from "next/link";
import { Icon } from "@/ui/components/Icon";
import { ShopNav } from "@/ui/components/ShopNav";
import { ShopProvider } from "@/ui/shop-context";
import styles from "./shop.module.css";

const sans = Manrope({ subsets: ["cyrillic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

export const metadata: Metadata = { title: "Магазин снов" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f4f0fa" };

/** The mini app: the same pages run inside Telegram and in the buyer phone on the site. */
export default function ShopLayout({ children }: LayoutProps<"/app">) {
  return (
    <ShopProvider>
      <div className={`${styles.shop} ${sans.variable}`}>
        <header className={styles.header}>
          <Link href="/app" className={styles.brand}>
            <span className={styles.logo}>
              <Icon name="moon" size={18} />
            </span>
            Магазин снов
          </Link>
          <span className={styles.demo}>Демо · товары вымышлены</span>
        </header>
        <main className={styles.main}>{children}</main>
        <ShopNav />
      </div>
    </ShopProvider>
  );
}
