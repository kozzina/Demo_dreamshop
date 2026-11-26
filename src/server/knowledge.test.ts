import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { dreamDetails } = await import("./knowledge");

describe("dream descriptions from the knowledge base", () => {
  it("reads teaser, scenes and notes of every dream", () => {
    const forest = dreamDetails("forest-cabin");
    expect(forest?.teaser).toMatch(/^Телефон не ловит/);
    expect(forest?.scenes[0]).toBe("тропинка через сосновый лес");
    expect(dreamDetails("no-alarm-sleep")?.scenes.length).toBeGreaterThan(0);
    expect(dreamDetails("first-snow")?.notes).toMatch(/декабре/);
  });
});
