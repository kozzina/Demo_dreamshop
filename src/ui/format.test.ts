import { describe, expect, it } from "vitest";
import { plural } from "./format";

describe("Russian plurals", () => {
  it.each([
    [1, "сон"],
    [3, "сна"],
    [5, "снов"],
    [11, "снов"],
    [21, "сон"],
    [24, "сна"],
  ])("%i → %s", (n, word) => {
    expect(plural(n, ["сон", "сна", "снов"])).toBe(word);
  });
});
