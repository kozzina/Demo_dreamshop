// Applies pending migrations from ./drizzle over Neon's HTTP driver.
// drizzle-kit migrate goes through the WebSocket driver, which can stop before recording
// the migration in the journal; the HTTP migrator finishes and exits cleanly.
// Usage: npm run db:migrate   (reads DATABASE_URL from .env.local)
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

await migrate(drizzle({ client: neon(url) }), { migrationsFolder: "./drizzle" });
console.log("Migrations are up to date");
