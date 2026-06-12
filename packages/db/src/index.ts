import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

export * from "./schema";
export { nanoid } from "nanoid";

export type Db = BetterSQLite3Database<typeof schema>;

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', draft_schema TEXT NOT NULL,
  published_version_id TEXT, submission_count INTEGER NOT NULL DEFAULT 0,
  ai_insights TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS forms_slug_idx ON forms (slug);

CREATE TABLE IF NOT EXISTS form_versions (
  id TEXT PRIMARY KEY, form_id TEXT NOT NULL, version INTEGER NOT NULL,
  schema TEXT NOT NULL, schema_version INTEGER NOT NULL, published_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS form_versions_form_version_idx ON form_versions (form_id, version);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY, form_id TEXT NOT NULL, form_version_id TEXT NOT NULL,
  answers TEXT NOT NULL, email TEXT, spam_score REAL NOT NULL DEFAULT 0,
  spam_signals TEXT, status TEXT NOT NULL, dedupe_key TEXT, session_id TEXT,
  referrer TEXT, country_code TEXT, device_type TEXT, user_agent TEXT,
  embed_source TEXT, time_to_complete_ms INTEGER, read_at INTEGER, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS submissions_form_created_idx ON submissions (form_id, created_at);
CREATE INDEX IF NOT EXISTS submissions_form_status_idx ON submissions (form_id, status);
CREATE INDEX IF NOT EXISTS submissions_form_email_idx ON submissions (form_id, email);

CREATE TABLE IF NOT EXISTS partial_submissions (
  id TEXT PRIMARY KEY, form_id TEXT NOT NULL, session_id TEXT NOT NULL,
  answers TEXT NOT NULL, email TEXT, last_field_id TEXT, resume_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS partials_form_session_idx ON partial_submissions (form_id, session_id);
CREATE INDEX IF NOT EXISTS partials_resume_token_idx ON partial_submissions (resume_token);

CREATE TABLE IF NOT EXISTS form_events (
  id TEXT PRIMARY KEY, form_id TEXT NOT NULL, event_type TEXT NOT NULL,
  field_id TEXT, page_id TEXT, session_id TEXT NOT NULL, duration_ms INTEGER,
  device_type TEXT, country_code TEXT, referrer TEXT, embed_source TEXT,
  meta TEXT, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS form_events_form_type_idx ON form_events (form_id, event_type);
`;

let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;
  const file = process.env.FIELDO_DB_PATH ?? path.join(process.cwd(), ".data", "fieldo.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(INIT_SQL);
  _db = drizzle(sqlite, { schema });
  return _db;
}
