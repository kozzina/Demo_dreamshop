import type { DreamSlug } from "@/domain/catalog";

/**
 * Shop copy for the mini app screens. Every line comes from content/knowledge.md
 * (sections 1, 2 and 5); dream descriptions themselves are read from the knowledge base directly.
 */

export const MOTTO = "Выспаться — тоже приключение";

export const STORY =
  "Мастерская началась с одного сна — «Моря из детства», которое основательница собрала для бабушки. Сейчас в каталоге десять снов, и каждый проверен на тестовых ночах.";

export const PRINCIPLES = ["Без кошмаров и резких звуков", "Добрые финалы", "Мягкое пробуждение"] as const;

/** One label per cover, from the «Нюансы» of each dream. Low stock is shown instead when it applies. */
export const BADGES: Partial<Record<DreamSlug, string>> = {
  "childhood-sea": "Хит",
  "flight-over-city": "Лимитированная серия",
  "no-alarm-sleep": "Вся ночь",
  "first-snow": "Поставка в декабре",
  "library-night": "Разные финалы",
  "exam-passed": "Можно в паре",
  "forest-cabin": "Долгий сюжет",
  "cat-cafe": "Без аллергии",
};

/** Sets from section 5: dreams go on consecutive nights, in this order. Price is the sum of the dreams. */
export interface DreamSet {
  id: string;
  name: string;
  pitch: string;
  dreams: readonly DreamSlug[];
}

export const SETS: readonly DreamSet[] = [
  { id: "reboot", name: "Перезагрузка", pitch: "Отключиться в лесном домике, а на следующую ночь — просто выспаться.", dreams: ["forest-cabin", "no-alarm-sleep"] },
  { id: "childhood", name: "Детство", pitch: "Море, песок и коты, которые выбрали вас. Тёплый подарок родителям и друзьям.", dreams: ["childhood-sea", "cat-cafe"] },
  { id: "big-day", name: "Перед большим днём", pitch: "Выспаться за две ночи до события, а накануне — услышать «получилось».", dreams: ["no-alarm-sleep", "exam-passed"] },
];

/** Quick asks for Sonya. Until the assistant is connected they open the matching selection. */
export const ASSISTANT_PROMPTS: readonly { label: string; href: string }[] = [
  { label: "Хочу выспаться", href: "/app?mood=calm" },
  { label: "Что-нибудь яркое", href: "/app?mood=adventure" },
  { label: "Перед экзаменом", href: "/app?mood=big-day" },
  { label: "Нужно вдохновение", href: "/app?mood=inspiration" },
  { label: "Сон для ребёнка", href: "/app?mood=kids" },
  { label: "Подарок", href: "/app/sets" },
];

/** What the buyer sees under each status: the shop's own words (knowledge base, section 4). */
export const STATUS_NOTE: Record<string, string> = {
  new: "Заказ оформлен. Скоро его возьмут в работу.",
  accepted: "Заказ взяли в работу. Подготовка занимает пару минут.",
  assembling: "Мастерская настраивает сюжет под вашу ночь.",
  delivering: "Сон готов и ждёт ночи. Просто ложитесь спать.",
  delivered: "Надеемся, вам понравилось.",
  cancelled: "Заказ отменён, деньги вернутся (в демо — условно).",
};

/** «Доброй ночи» before 5, morning until 12, day until 18, evening after. */
export function greeting(hour: number): string {
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}
