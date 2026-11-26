# Dream Shop

A demo online shop in Telegram that shows three things businesses ask for most:

- **a bot with a mini app** — the buyer chats with the shop and opens a catalogue, cart and checkout inside Telegram;
- **an AI assistant that works with the shop** — it answers from a knowledge base, picks a dream, checks stock, fills the cart and places the order through tools;
- **a manager bot** — a live feed of orders with action buttons, shown as a phone on the portfolio site.

The shop sells dreams. The products are fictional and no money is charged: it is a demo of how such a system is built, not a store.

> Status: in development.

## How it works

```
Telegram: shop bot + mini app          Portfolio site: manager phone
            │                                     │
            ▼                                     ▼
   Next.js app (App Router, TypeScript) ── API routes ── Postgres
            │
            ▼
   AI assistant: LLM + tools, every action re-checked on the server
```

- **Domain rules live in one place.** `src/domain/` is plain TypeScript with no framework: prices in integer cents, cart and night rules, the order status machine. The API, the mini app and the assistant all go through it, so the rules cannot drift apart.
- **The model never decides money or stock.** The assistant can only call tools; the server validates each call (the dream exists, stock and per-order limits, night rules, the order belongs to the buyer).
- **The model was chosen by tests, not by taste.** Five models were compared on 65 scripted dialogs — purchases, cart changes, cancellations, status checks, off-topic questions and prompt-injection attempts. Claude Haiku 5.5 is the main model, GLM-5.3-Flash the fallback.
- **Costs are capped.** 20 assistant messages per buyer per day and a daily budget for all buyers; without the assistant the shop keeps working.
- **Telegram data is verified, not trusted.** The mini app sends its signed launch data; the server checks the HMAC with the bot token and takes only the user id. The bot chat and the mini app share one sandbox, so what happens in one shows up in the other.
- **Notifications never slow the shop down.** Order updates go to the buyer's chat after the response is sent; a Telegram failure is logged, not shown.
- **One designed look, not a theme lottery.** The mini app is «a night shop window»: its own night palette, serif titles, a strip of nights instead of a dropdown. Concept, tokens and accessibility notes: [docs/DESIGN.md](docs/DESIGN.md).
- **No personal data.** Telegram names are not stored, checkout uses fictional data, sessions expire.

## Project structure

```
src/
  app/         routes: mini app, manager feed, API
  domain/      business rules: catalogue, money, cart, orders (unit-tested)
  server/      server-only code: config, database, assistant, Telegram
  ui/          mini app client: API client, shop state, shared components
```

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

```bash
npm test          # unit tests
npm run typecheck
npm run lint
```

## Deploy

1. Deploy to any Node host (the demo runs on Vercel, region `fra1`, next to the Neon database) with the variables from `.env.example`.
2. Apply migrations: `npm run db:migrate`.
3. Point the bot at the deployment — webhook, menu button, profile texts:

```bash
APP_URL=https://your-deployment.example npm run telegram:setup
```
