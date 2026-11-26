import { cents, type Cents } from "./money";

export type DreamSlug =
  | "flight-over-city"
  | "childhood-sea"
  | "no-alarm-sleep"
  | "first-snow"
  | "library-night"
  | "mountain-dawn"
  | "exam-passed"
  | "cat-cafe"
  | "space-walk"
  | "forest-cabin";

export type AgeRating = "0+" | "6+" | "12+";

export interface Dream {
  slug: DreamSlug;
  name: { ru: string; en: string };
  genre: string;
  minutes: number;
  price: Cents;
  /** Starting stock of every session sandbox. */
  stock: number;
  age: AgeRating;
  /** Takes the whole night and cannot share it with another dream. */
  wholeNight: boolean;
}

/** Catalogue from KNOWLEDGE.md, section 2. Descriptions live in the knowledge base, not here. */
export const CATALOG: readonly Dream[] = [
  { slug: "flight-over-city", name: { ru: "Полёт над городом", en: "Flight over the City" }, genre: "приключение", minutes: 40, price: cents(890), stock: 3, age: "12+", wholeNight: false },
  { slug: "childhood-sea", name: { ru: "Море из детства", en: "Childhood Sea" }, genre: "ностальгия", minutes: 60, price: cents(690), stock: 8, age: "0+", wholeNight: false },
  { slug: "no-alarm-sleep", name: { ru: "Сон без будильника", en: "Sleep Without an Alarm" }, genre: "отдых", minutes: 480, price: cents(1190), stock: 12, age: "0+", wholeNight: true },
  { slug: "first-snow", name: { ru: "Первый снег", en: "First Snow" }, genre: "ностальгия", minutes: 30, price: cents(590), stock: 0, age: "0+", wholeNight: false },
  { slug: "library-night", name: { ru: "Ночь в библиотеке", en: "Night in the Library" }, genre: "загадка", minutes: 50, price: cents(750), stock: 5, age: "12+", wholeNight: false },
  { slug: "mountain-dawn", name: { ru: "Рассвет в горах", en: "Mountain Dawn" }, genre: "природа", minutes: 45, price: cents(850), stock: 4, age: "6+", wholeNight: false },
  { slug: "exam-passed", name: { ru: "Экзамен сдан", en: "Exam Passed" }, genre: "уверенность", minutes: 20, price: cents(490), stock: 20, age: "6+", wholeNight: false },
  { slug: "cat-cafe", name: { ru: "Кафе с котами", en: "Cat Café" }, genre: "уют", minutes: 35, price: cents(550), stock: 7, age: "0+", wholeNight: false },
  { slug: "space-walk", name: { ru: "Выход в открытый космос", en: "Spacewalk" }, genre: "приключение", minutes: 40, price: cents(990), stock: 2, age: "12+", wholeNight: false },
  { slug: "forest-cabin", name: { ru: "Домик в лесу", en: "Forest Cabin" }, genre: "природа", minutes: 90, price: cents(890), stock: 6, age: "0+", wholeNight: false },
];

const BY_SLUG = new Map<string, Dream>(CATALOG.map((dream) => [dream.slug, dream]));

export const findDream = (slug: string): Dream | undefined => BY_SLUG.get(slug);

export const isDreamSlug = (slug: string): slug is DreamSlug => BY_SLUG.has(slug);
