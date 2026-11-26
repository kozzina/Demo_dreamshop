import { describe, expect, it } from "vitest";
import { cleanSummary, SUMMARY_MAX } from "./manager-request";

describe("manager request summary for the shared feed", () => {
  it("keeps a plain summary and order numbers", () => {
    expect(cleanSummary("Хочет отменить заказ №1047: передумала")).toBe("Хочет отменить заказ №1047: передумала");
  });

  it("strips phones, e-mails, links and handles", () => {
    const text = "Перезвоните +7 (999) 123-45-67, пишите a.b@mail.ru или @someone, сайт https://x.io/y";
    const clean = cleanSummary(text);
    expect(clean).not.toMatch(/999|mail\.ru|someone|x\.io/);
    expect(clean).toContain("[номер]");
    expect(clean).toContain("[почта]");
  });

  it("cuts a long summary on a word boundary", () => {
    const clean = cleanSummary("слово ".repeat(60));
    expect(clean.length).toBeLessThanOrEqual(SUMMARY_MAX);
    expect(clean.endsWith("…")).toBe(true);
  });
});
