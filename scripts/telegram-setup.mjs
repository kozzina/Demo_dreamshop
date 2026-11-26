/**
 * One-off bot setup after a deploy: webhook, menu button that opens the mini app, profile texts.
 * Usage: APP_URL=https://… npm run telegram:setup   (token and secret come from .env.local)
 * Safe to run again: every call overwrites the previous value.
 */
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, APP_URL } = process.env;
if (!token || !secret || !APP_URL) throw new Error("Need TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET and APP_URL");
const appUrl = APP_URL.replace(/\/$/, "");

async function call(method, params) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  const body = await res.json();
  // Print only the method and Telegram's answer, never the URL with the token.
  console.log(method, body.ok ? "ok" : `failed: ${body.description}`);
  if (!body.ok) process.exitCode = 1;
}

await call("setWebhook", {
  url: `${appUrl}/api/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ["message"],
  drop_pending_updates: true,
});
await call("setChatMenuButton", { menu_button: { type: "web_app", text: "Магазин", web_app: { url: `${appUrl}/app` } } });
await call("setMyCommands", { commands: [{ command: "start", description: "Начать сначала" }] });
await call("setMyShortDescription", { short_description: "Демо магазина с мини-приложением и AI-ассистентом. Товары вымышленные." });
await call("setMyDescription", {
  description: "Демо интернет-магазина с мини-приложением и AI-ассистентом. Товары вымышленные, деньги не списываются.",
});
