/**
 * Thin wrapper over Telegram's Mini App SDK (telegram-web-app.js). The SDK is loaded only when the
 * page was launched from Telegram; on the portfolio site nothing is loaded and every call is a no-op.
 */
interface TelegramWebApp {
  ready(): void;
  expand(): void;
  initData: string;
  isVersionAtLeast(version: string): boolean;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  HapticFeedback?: { impactOccurred(style: "light" | "medium"): void; notificationOccurred(type: "success" | "error"): void };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const SDK_URL = "https://telegram.org/js/telegram-web-app.js";
/** Telegram passes launch data in the URL hash; the SDK keeps a copy here for reloads. */
const LAUNCH_HASH = "tgWebAppData=";
const LAUNCH_STORAGE_KEY = "__telegram__initParams";
/** The shop's background colour (--bg in shop.module.css): Telegram paints its header and edges in it. */
const SHOP_BACKGROUND = "#f4f0fa";

const webApp = (): TelegramWebApp | undefined => (typeof window === "undefined" ? undefined : window.Telegram?.WebApp);

const launchedFromTelegram = (): boolean =>
  window.location.hash.includes(LAUNCH_HASH) || (sessionStorage.getItem(LAUNCH_STORAGE_KEY) ?? "").includes("tgWebAppData");

let loading: Promise<void> | undefined;

/** Loads the SDK once and tells Telegram the app is ready. Resolves even if the script fails. */
export function loadTelegram(): Promise<void> {
  if (typeof window === "undefined" || !launchedFromTelegram()) return Promise.resolve();
  loading ??= new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.onload = () => {
      const app = webApp();
      app?.ready();
      app?.expand();
      if (app) paintChrome(app);
      resolve();
    };
    script.onerror = () => resolve();
    document.head.append(script);
  });
  return loading;
}

/** Custom header colours arrived in Mini Apps 6.1, the bottom bar colour in 7.10. */
function paintChrome(app: TelegramWebApp): void {
  if (!app.isVersionAtLeast("6.1")) return;
  app.setHeaderColor(SHOP_BACKGROUND);
  app.setBackgroundColor(SHOP_BACKGROUND);
  if (app.isVersionAtLeast("7.10")) app.setBottomBarColor?.(SHOP_BACKGROUND);
}

/** Signed launch data; empty outside Telegram. */
export const telegramInitData = (): string => webApp()?.initData ?? "";

export function haptic(kind: "tap" | "success" | "error"): void {
  const app = webApp();
  // Haptics arrived in Mini Apps 6.1; older clients log a warning on every call.
  const feedback = app?.isVersionAtLeast("6.1") ? app.HapticFeedback : undefined;
  if (!feedback) return;
  if (kind === "tap") feedback.impactOccurred("light");
  else feedback.notificationOccurred(kind);
}
