import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { ShopNav } from "@/ui/components/ShopNav";
import { ShopProvider } from "@/ui/shop-context";
import { VeraProvider } from "@/ui/vera";
import styles from "./shop.module.css";

const sans = Manrope({ subsets: ["cyrillic", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans" });

export const metadata: Metadata = { title: "Магазин снов" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f4f0fa" };

/**
 * The mini app: the same pages run inside Telegram and in the buyer phone on the site.
 * Each screen draws its own top bar; the tab bar and Vera are shared.
 */
export default function ShopLayout({ children }: LayoutProps<"/app">) {
  return (
    <ShopProvider>
      <div className={`${styles.shop} ${sans.variable}`}>
        {/* Inside the themed root, so the sheet inherits the shop's fonts and tokens. */}
        <VeraProvider>
          <main className={styles.main}>{children}</main>
          <ShopNav />
        </VeraProvider>
      </div>
    </ShopProvider>
  );
}
