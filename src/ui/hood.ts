/**
 * «Под капотом»: the switch on the case page and the chat inside the buyer phone are different
 * documents on one origin, so the flag lives in localStorage and travels by the storage event.
 */
const KEY = "dream-shop:hood";

export const hoodOn = (): boolean => typeof window !== "undefined" && localStorage.getItem(KEY) === "1";

export function setHood(on: boolean): void {
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
