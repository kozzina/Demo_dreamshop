import type { DreamSlug } from "@/domain/catalog";
import type { CatalogItem } from "@/shared/contract";

/** Catalogue filters, from the «Подбор по запросу» table of the knowledge base. */
export const MOODS: { id: string; label: string; match: (dream: CatalogItem) => boolean }[] = [
  { id: "all", label: "Все", match: () => true },
  { id: "calm", label: "Спокойное", match: (d) => is(d, ["no-alarm-sleep", "forest-cabin", "childhood-sea", "mountain-dawn"]) },
  { id: "adventure", label: "Приключение", match: (d) => is(d, ["flight-over-city", "space-walk"]) },
  { id: "cosy", label: "Уют", match: (d) => is(d, ["cat-cafe", "forest-cabin", "library-night", "first-snow"]) },
  { id: "big-day", label: "Перед важным днём", match: (d) => is(d, ["exam-passed", "no-alarm-sleep"]) },
  { id: "kids", label: "Ребёнку", match: (d) => d.age !== "12+" },
];

const is = (dream: CatalogItem, slugs: DreamSlug[]) => slugs.includes(dream.slug);
