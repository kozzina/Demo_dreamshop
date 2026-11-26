import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { verifyInitData } = await import("./init-data");

const TOKEN = "123456:test-token";
const NOW = new Date("2026-11-26T12:00:00Z");
const nowSeconds = NOW.getTime() / 1000;

/** Signs launch data the way Telegram does. */
function sign(fields: Record<string, string>, token = TOKEN): string {
  const checkString = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(checkString).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

const user = JSON.stringify({ id: 42, first_name: "Test", language_code: "ru" });

describe("verifyInitData", () => {
  it("accepts data signed with the bot token and returns only id and language", () => {
    const result = verifyInitData(sign({ auth_date: String(nowSeconds - 60), query_id: "q", user }), TOKEN, NOW);
    expect(result).toEqual({ ok: true, value: { chatId: 42, lang: "ru" } });
  });

  it("refuses data signed with another token", () => {
    const result = verifyInitData(sign({ auth_date: String(nowSeconds), user }, "999:other"), TOKEN, NOW);
    expect(result).toMatchObject({ ok: false, error: "bad_signature" });
  });

  it("refuses tampered data", () => {
    const raw = sign({ auth_date: String(nowSeconds), user }).replace("%22id%22%3A42", "%22id%22%3A43");
    expect(verifyInitData(raw, TOKEN, NOW)).toMatchObject({ ok: false, error: "bad_signature" });
  });

  it("refuses data older than a day", () => {
    const result = verifyInitData(sign({ auth_date: String(nowSeconds - 25 * 3600), user }), TOKEN, NOW);
    expect(result).toMatchObject({ ok: false, error: "expired" });
  });

  it("refuses data without a hash or a user", () => {
    expect(verifyInitData("auth_date=1", TOKEN, NOW)).toMatchObject({ ok: false, error: "bad_signature" });
    expect(verifyInitData(sign({ auth_date: String(nowSeconds) }), TOKEN, NOW)).toMatchObject({ ok: false, error: "no_user" });
  });

  it("uses English for non-Russian Telegram clients", () => {
    const en = JSON.stringify({ id: 7, language_code: "de" });
    expect(verifyInitData(sign({ auth_date: String(nowSeconds), user: en }), TOKEN, NOW)).toMatchObject({ value: { lang: "en" } });
  });
});
