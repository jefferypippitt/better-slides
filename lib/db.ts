import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import {
  account,
  deck,
  deckWidget,
  presenterPresence,
  presenterSync,
  session,
  user,
  verification,
} from "./db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, {
  schema: {
    account,
    deck,
    deckWidget,
    presenterPresence,
    presenterSync,
    session,
    user,
    verification,
  },
});
