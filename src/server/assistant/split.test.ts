import { describe, expect, it } from "vitest";
import { splitReply } from "./split";

describe("splitting a reply into chat messages", () => {
  it("keeps a short answer whole", () => {
    expect(splitReply("Я бы взяла «Домик в лесу». Поставить на сегодня?")).toHaveLength(1);
  });

  it("splits a long answer at a paragraph break", () => {
    const first = "А".repeat(150);
    const second = "Б".repeat(150);
    expect(splitReply(`${first}\n\n${second}`)).toEqual([first, second]);
  });

  it("splits a long answer without paragraphs at a sentence break", () => {
    const parts = splitReply(`${"Слово ".repeat(30).trim()}. ${"Ещё ".repeat(30).trim()}.`);
    expect(parts).toHaveLength(2);
    expect(parts[0].endsWith(".")).toBe(true);
  });
});
