/**
 * «Под капотом»: when the shop is embedded in the case page of the portfolio site, the page's
 * switch asks the chat to show Sonya's tool calls. The page is another origin, so the switch
 * arrives as a message from the parent window; the flag lives in localStorage so it survives
 * navigation inside the mini app.
 */
const KEY = "dream-shop:hood";
const MESSAGE = "dream-shop:hood";

export const hoodOn = (): boolean => typeof window !== "undefined" && localStorage.getItem(KEY) === "1";

function setHood(on: boolean): void {
  localStorage.setItem(KEY, on ? "1" : "0");
  // The storage event reaches other documents only; tell this one too.
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function subscribeHood(onChange: () => void): () => void {
  const listener = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

/**
 * Accepts the switch only from the window that embeds the shop, and only in its exact shape.
 * The flag shows the buyer their own chat's tool calls, so there is nothing to protect beyond that.
 */
export function listenForHoodSwitch(): () => void {
  const listener = (e: MessageEvent) => {
    if (e.source !== window.parent || window.parent === window) return;
    const data = e.data as { type?: unknown; on?: unknown } | null;
    if (data?.type === MESSAGE && typeof data.on === "boolean") setHood(data.on);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
