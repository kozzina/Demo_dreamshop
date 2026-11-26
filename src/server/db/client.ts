import "server-only";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { config } from "../config";
import * as schema from "./schema";

// Node 20 has no global WebSocket; Neon's driver needs one for transactions.
neonConfig.webSocketConstructor ??= ws;

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

export type Db = ReturnType<typeof db>;
/** A transaction handle, so services can run inside a caller's transaction. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
