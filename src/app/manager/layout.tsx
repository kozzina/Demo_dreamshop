import type { Metadata, Viewport } from "next";
import "./manager.css";

export const metadata: Metadata = { title: "Менеджер · Dream Shop" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f7f7f7" };

/** The manager's phone: a Telegram chat with the shop's service bot. Shown in the right phone on the case page. */
export default function ManagerLayout({ children }: LayoutProps<"/manager">) {
  return children;
}
