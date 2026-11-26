import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { ShopNav } from "@/ui/components/ShopNav";
import { ShopProvider } from "@/ui/shop-context";
import { AssistantProvider } from "@/ui/assistant";
import styles from "./shop.module.css";

/** Display face for titles: wide, soft, a little dreamy; Manrope stays for everything you read. */
const display = Unbounded({ subsets: ["cyrillic", "latin"], weight: ["500", "600"], variable: "--font-display" });
const sans = Manrope({ subsets: ["cyrillic", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans" });

export const metadata: Metadata = { title: "Dream Shop" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f4f0fa" };

/**
 * The mini app: the same pages run inside Telegram and in the buyer phone on the site.
 * Each screen draws its own top bar; the tab bar and Sonya are shared.
 */
export default function ShopLayout({ children }: LayoutProps<"/app">) {
  return (
    <ShopProvider>
      <div className={`${styles.shop} ${sans.variable} ${display.variable}`}>
        {/* Inside the themed root, so the sheet inherits the shop's fonts and tokens. */}
        <AssistantProvider>
          <main className={styles.main}>{children}</main>
          <ShopNav />
        </AssistantProvider>
      </div>
    </ShopProvider>
  );
}
