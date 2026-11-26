/**
 * Thin wrapper over Telegram's Mini App SDK (telegram-web-app.js). Outside Telegram — on the
 * portfolio site — every call is a no-op and the app runs as a normal web page.
 */
interface TelegramWebApp {
  ready(): void;
  expand(): void;
  initData: string;
  HapticFeedback?: { impactOccurred(style: "light" | "medium"): void; notificationOccurred(type: "success" | "error"): void };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const webApp = (): TelegramWebApp | undefined => (typeof window === "undefined" ? undefined : window.Telegram?.WebApp);

export const isTelegram = (): boolean => Boolean(webApp()?.initData);

export function initTelegram(): void {
  const app = webApp();
  app?.ready();
  app?.expand();
}

export function haptic(kind: "tap" | "success" | "error"): void {
  const feedback = webApp()?.HapticFeedback;
  if (!feedback) return;
  if (kind === "tap") feedback.impactOccurred("light");
  else feedback.notificationOccurred(kind);
}
