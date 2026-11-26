import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { DreamSlug } from "@/domain/catalog";

/**
 * content/knowledge.md is the single source of the shop's texts: the mini app shows dream
 * descriptions from it, and the assistant answers from it. Edit the document — both follow.
 */
const KNOWLEDGE_PATH = path.join(process.cwd(), "content", "knowledge.md");

let cache: string | undefined;
export const knowledgeText = (): string => (cache ??= readFileSync(KNOWLEDGE_PATH, "utf8"));

export interface DreamDetails {
  teaser: string;
  scenes: string[];
  feelings?: string;
  goodFor?: string;
  notFor?: string;
  notes?: string;
}

const FIELDS: Record<string, keyof DreamDetails> = {
  "Тизер": "teaser",
  "Сюжет по сценам": "scenes",
  "Что внутри": "scenes",
  "Ощущения": "feelings",
  "Подходит": "goodFor",
  "Не подходит": "notFor",
  "Нюансы": "notes",
};

/** Parses one «### 2.x» section of the catalogue: bullet lines of the form «- **Field:** value». */
export function parseDreamSection(section: string): DreamDetails {
  const details: DreamDetails = { teaser: "", scenes: [] };
  for (const line of section.split("\n")) {
    const match = line.match(/^- \*\*(.+?):\*\* (.+)$/);
    const field = match && FIELDS[match[1]];
    if (!match || !field) continue;
    const value = match[2].replace(/^\*(.+)\*$/, "$1").trim();
    if (field === "scenes") details.scenes = value.split(/\s*→\s*/).map((s) => s.replace(/\.$/, ""));
    else details[field] = value;
  }
  return details;
}

let details: Map<string, DreamDetails> | undefined;

export function dreamDetails(slug: DreamSlug): DreamDetails | null {
  if (!details) {
    details = new Map();
    for (const section of knowledgeText().split(/\n(?=### )/)) {
      const slugMatch = section.match(/\*\*slug:\*\* `([a-z-]+)`/);
      if (slugMatch) details.set(slugMatch[1], parseDreamSection(section));
    }
  }
  return details.get(slug) ?? null;
}
