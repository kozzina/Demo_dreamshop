"use client";

import Script from "next/script";
import { initTelegram } from "../telegram";

/** Telegram's Mini App SDK; harmless outside Telegram. */
export function TelegramScript() {
  return <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onLoad={initTelegram} />;
}
