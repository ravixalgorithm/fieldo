import { eq } from "drizzle-orm";
import { getDb, users } from "@fieldo/db";
import { DEMO_ACCOUNT, seedDemo } from "./seed-demo";

let ensured = false;

/** Idempotent — seeds demo workspace if the designer account is missing. */
export function ensureDemoSeeded() {
  if (ensured) return;
  ensured = true;
  const db = getDb();
  const existing = db.select().from(users).where(eq(users.email, DEMO_ACCOUNT.email)).get();
  if (existing) return;
  seedDemo({ fresh: true });
}
