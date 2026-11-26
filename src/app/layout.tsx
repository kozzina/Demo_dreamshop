import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dream Shop — demo",
  description: "A demo shop in Telegram: bot, mini app, AI assistant and a manager feed. Fictional products, no real payments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
