import { addDays, BOOKING_WINDOW_DAYS, today } from "@/domain/nights";
import type { OrderStatus } from "@/domain/order";
import type { ApiError } from "@/shared/contract";

const DAY = new Intl.DateTimeFormat("ru", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });

/** «Сегодня», «Завтра», «пт, 28 ноября». */
export function nightLabel(night: string): string {
  const first = today();
  if (night === first) return "Сегодня";
  if (night === addDays(first, 1)) return "Завтра";
  return DAY.format(new Date(`${night}T00:00:00Z`));
}

const WEEKDAY = new Intl.DateTimeFormat("ru", { weekday: "short", timeZone: "UTC" });
const DAY_MONTH = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short", timeZone: "UTC" });

/** Two lines for the night strip: «Сегодня» / «26 нояб.», «пт» / «28 нояб.». */
export function nightParts(night: string): { day: string; date: string } {
  const date = new Date(`${night}T00:00:00Z`);
  const first = today();
  const day = night === first ? "Сегодня" : night === addDays(first, 1) ? "Завтра" : WEEKDAY.format(date);
  return { day, date: DAY_MONTH.format(date) };
}

/** Compact label for night dropdowns: «Сегодня», «Завтра», «пт, 28 нояб.». */
export function shortNightLabel(night: string): string {
  const { day, date } = nightParts(night);
  return day === "Сегодня" || day === "Завтра" ? day : `${day}, ${date}`;
}

export const bookableNights = (): string[] => Array.from({ length: BOOKING_WINDOW_DAYS + 1 }, (_, i) => addDays(today(), i));

/** Russian plural: plural(3, ["сон", "сна", "снов"]) → «сна». */
export function plural(n: number, [one, few, many]: readonly [string, string, string]): string {
  const tens = n % 100;
  const units = n % 10;
  if (tens >= 11 && tens <= 14) return many;
  if (units === 1) return one;
  return units >= 2 && units <= 4 ? few : many;
}

export const minutesLabel = (minutes: number): string =>
  minutes >= 60 ? `${Math.floor(minutes / 60)} ч${minutes % 60 ? ` ${minutes % 60} мин` : ""}` : `${minutes} мин`;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Оформлен",
  accepted: "Принят",
  assembling: "Собирается",
  delivering: "Ждёт ночи",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

const NIGHT_REASON: Record<string, string> = {
  whole_night_dream: "«Сон без будильника» занимает всю ночь — поставьте его на отдельную ночь.",
  too_many_dreams: "На одну ночь — не больше двух снов. Выберите другую ночь.",
  too_long: "На одну ночь — до 6 часов снов. Выберите другую ночь.",
};

/** API error codes in human words. */
export function errorMessage(error: ApiError): string {
  switch (error.error) {
    case "not_enough_stock":
      return error.details?.available ? `Осталось только ${error.details.available} шт.` : "Этот сон закончился.";
    case "qty_limit":
      return "Не больше 5 штук одного сна в заказе.";
    case "night_conflict":
      return NIGHT_REASON[String(error.details?.reason)] ?? "Эти сны не получится поставить на одну ночь.";
    case "bad_night":
      return "Ночь можно выбрать на ближайшие 30 дней.";
    case "cart_empty":
      return "Корзина пуста.";
    case "no_session":
      return "Сессия устарела — обновите страницу.";
    default:
      return "Что-то пошло не так. Попробуйте ещё раз.";
  }
}

const SHORT_WORDS = /(^|[\s(«—])(в|во|с|со|и|а|к|о|у|я|не|но|на|по|за|до|из|от|для|без|под|при|что|как|или) /giu;

/** Site typography rules: short words and numbers do not hang at the end of a line. */
export const typo = (text: string): string =>
  text.replace(SHORT_WORDS, "$1$2 ").replace(SHORT_WORDS, "$1$2 ").replace(/(\d) (?=\p{L})/gu, "$1 ").replace(/ —/g, " —");
