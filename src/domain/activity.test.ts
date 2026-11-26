import { describe, expect, it } from "vitest";
import { activityDue, planActivity } from "./activity";
import { nightConflict } from "./cart";

const TODAY = "2026-11-26";

describe("background activity in the manager feed", () => {
  it("waits four to five minutes of quiet", () => {
    expect(activityDue(200, 7)).toBe(false);
    expect(activityDue(239, 0)).toBe(false);
    expect(activityDue(240, 0)).toBe(true);
    expect(activityDue(301, 12345)).toBe(true);
  });

  it("plans valid orders and requests for many seeds", () => {
    let orders = 0;
    let requests = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const activity = planActivity(seed, TODAY);
      if (activity.kind === "request") {
        requests++;
        expect(activity.summary.length).toBeGreaterThan(0);
        continue;
      }
      orders++;
      expect(activity.lines.length).toBeGreaterThanOrEqual(1);
      for (const line of activity.lines) {
        expect(line.slug).not.toBe("first-snow");
        expect(line.night >= TODAY && line.night <= "2026-11-29").toBe(true);
      }
      // every line fits its night next to the others
      activity.lines.forEach((line, i) => expect(nightConflict(activity.lines.filter((_, j) => j !== i), line.slug, line.night)).toBeNull());
    }
    expect(orders).toBeGreaterThan(requests);
    expect(requests).toBeGreaterThan(0);
  });

  it("is the same for the same seed", () => {
    expect(planActivity(42, TODAY)).toEqual(planActivity(42, TODAY));
  });
});
