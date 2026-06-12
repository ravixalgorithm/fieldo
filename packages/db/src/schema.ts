import { integer, real, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

// SQLite for zero-setup local dev; column shapes mirror the PRD's Postgres
// schema so the swap to Drizzle/pg is mechanical.

export const forms = sqliteTable(
  "forms",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: text("status", { enum: ["draft", "published", "closed", "archived"] })
      .notNull()
      .default("draft"),
    draftSchema: text("draft_schema", { mode: "json" }).notNull(),
    publishedVersionId: text("published_version_id"),
    submissionCount: integer("submission_count").notNull().default(0),
    aiInsights: text("ai_insights", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("forms_slug_idx").on(t.slug)]
);

export const formVersions = sqliteTable(
  "form_versions",
  {
    id: text("id").primaryKey(),
    formId: text("form_id").notNull(),
    version: integer("version").notNull(),
    schema: text("schema", { mode: "json" }).notNull(),
    schemaVersion: integer("schema_version").notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("form_versions_form_version_idx").on(t.formId, t.version)]
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    formId: text("form_id").notNull(),
    formVersionId: text("form_version_id").notNull(),
    answers: text("answers", { mode: "json" }).notNull(),
    email: text("email"),
    spamScore: real("spam_score").notNull().default(0),
    spamSignals: text("spam_signals", { mode: "json" }),
    status: text("status", { enum: ["complete", "flagged", "rejected"] }).notNull(),
    dedupeKey: text("dedupe_key"),
    sessionId: text("session_id"),
    referrer: text("referrer"),
    countryCode: text("country_code"),
    deviceType: text("device_type"),
    userAgent: text("user_agent"),
    embedSource: text("embed_source"),
    timeToCompleteMs: integer("time_to_complete_ms"),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("submissions_form_created_idx").on(t.formId, t.createdAt),
    index("submissions_form_status_idx").on(t.formId, t.status),
    index("submissions_form_email_idx").on(t.formId, t.email),
  ]
);

export const partialSubmissions = sqliteTable(
  "partial_submissions",
  {
    id: text("id").primaryKey(),
    formId: text("form_id").notNull(),
    sessionId: text("session_id").notNull(),
    answers: text("answers", { mode: "json" }).notNull(),
    email: text("email"),
    lastFieldId: text("last_field_id"),
    resumeToken: text("resume_token").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    uniqueIndex("partials_form_session_idx").on(t.formId, t.sessionId),
    index("partials_resume_token_idx").on(t.resumeToken),
  ]
);

export const formEvents = sqliteTable(
  "form_events",
  {
    id: text("id").primaryKey(),
    formId: text("form_id").notNull(),
    eventType: text("event_type").notNull(),
    fieldId: text("field_id"),
    pageId: text("page_id"),
    sessionId: text("session_id").notNull(),
    durationMs: integer("duration_ms"),
    deviceType: text("device_type"),
    countryCode: text("country_code"),
    referrer: text("referrer"),
    embedSource: text("embed_source"),
    meta: text("meta", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("form_events_form_type_idx").on(t.formId, t.eventType)]
);
