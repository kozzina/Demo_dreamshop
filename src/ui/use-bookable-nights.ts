import { useSyncExternalStore } from "react";
import { today } from "@/domain/nights";
import { bookableNights } from "./format";

/**
 * Bookable nights computed in the browser after mount. Pages are prerendered at build time,
 * so a date computed during render would freeze «today» at the build date.
 */
export function useBookableNights(): string[] {
  return useSyncExternalStore(subscribeNever, bookableNightsSnapshot, emptyNights);
}

const EMPTY: string[] = [];
const emptyNights = () => EMPTY;
const subscribeNever = () => () => {};
let snapshot: { day: string; nights: string[] } | undefined;
function bookableNightsSnapshot(): string[] {
  const day = today();
  if (snapshot?.day !== day) snapshot = { day, nights: bookableNights() };
  return snapshot.nights;
}
