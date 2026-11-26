import { describe, expect, it } from "vitest";
import { orderNotice } from "./messages";

const order = { number: 1047, total: "$8.90", items: [{ name: "Домик в лесу", night: "2026-11-28" }] };

describe("order notices", () => {
  it("names the dreams and nights when the order is placed", () => {
    expect(orderNotice({ ...order, status: "new" })).toBe("Заказ №1047 оформлен: «Домик в лесу», ночь на 28 ноября. Итого $8.90.");
  });

  it("tells which night the dream waits for", () => {
    const two = { ...order, items: [{ name: "Б", night: "2026-11-30" }, { name: "А", night: "2026-11-29" }] };
    expect(orderNotice({ ...two, status: "delivering" })).toContain("ждёт ночи 29 ноября");
  });
});
