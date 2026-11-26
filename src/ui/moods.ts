import { CATALOG, type DreamSlug } from "@/domain/catalog";

/** Catalogue occasions, from the «Подбор по запросу» table of the knowledge base. */
export interface Mood {
  id: string;
  label: string;
  slugs: readonly DreamSlug[];
}

const ALL = CATALOG.map((dream) => dream.slug);

export const MOODS: readonly Mood[] = [
  { id: "all", label: "Все", slugs: ALL },
  { id: "calm", label: "Спокойное", slugs: ["no-alarm-sleep", "forest-cabin", "childhood-sea"] },
  { id: "adventure", label: "Приключение", slugs: ["flight-over-city", "space-walk"] },
  { id: "cosy", label: "Уют", slugs: ["cat-cafe", "forest-cabin", "library-night", "first-snow"] },
  { id: "inspiration", label: "Вдохновение", slugs: ["mountain-dawn", "space-walk"] },
  { id: "big-day", label: "Перед важным днём", slugs: ["exam-passed", "no-alarm-sleep"] },
  { id: "mystery", label: "Загадка", slugs: ["library-night"] },
  { id: "kids", label: "Ребёнку", slugs: CATALOG.filter((dream) => dream.age !== "12+").map((dream) => dream.slug) },
  { id: "budget", label: "Недорого", slugs: ["exam-passed", "cat-cafe"] },
];

export const findMood = (id: string | null): Mood => MOODS.find((mood) => mood.id === id) ?? MOODS[0];

/** Dreams that share an occasion with this one (age and budget filters say nothing about the feel). */
export function similarDreams(slug: DreamSlug, limit = 3): DreamSlug[] {
  const feelMoods = MOODS.filter((mood) => !["all", "kids", "budget"].includes(mood.id) && mood.slugs.includes(slug));
  const similar = new Set(feelMoods.flatMap((mood) => mood.slugs).filter((other) => other !== slug));
  return [...similar].slice(0, limit);
}
