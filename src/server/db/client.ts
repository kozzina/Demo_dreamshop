import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { config } from "../config";
import * as schema from "./schema";

/**
 * Neon over WebSockets: supports transactions, which placing an order needs
 * (check stock, create the order, clear the cart — all or nothing).
 */
let instance: ReturnType<typeof create> | undefined;

function create() {
  return drizzle({ client: new Pool({ connectionString: config.database.url() }), schema });
}

export function db() {
  instance ??= create();
  return instance;
}
