import { integer, real, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

// SQLite for zero-setup local dev; column shapes mirror the PRD's Postgres
// schema so the swap to Drizzle/pg is mechanical.

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({ emailIdx: uniqueIndex("users_email_idx").on(t.email) })
);

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("owner"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({ wsUserIdx: uniqueIndex("members_ws_user_idx").on(t.workspaceId, t.userId) })
);

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: text("name").notNull(),
    /** sha256 of the full key; the key itself is shown once at creation */
    keyHash: text("key_hash").notNull(),
    /** first 12 chars for display, e.g. fld_AbC12xYz */
    prefix: text("prefix").notNull(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({ keyHashIdx: uniqueIndex("api_keys_hash_idx").on(t.keyHash) })
);

export const forms = sqliteTable(
  "forms",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id"),
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
  (t) => ({ slugIdx: uniqueIndex("forms_slug_idx").on(t.slug) })
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
  (t) => ({ formVersionIdx: uniqueIndex("form_versions_form_version_idx").on(t.formId, t.version) })
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
  (t) => ({
    formCreatedIdx: index("submissions_form_created_idx").on(t.formId, t.createdAt),
    formStatusIdx: index("submissions_form_status_idx").on(t.formId, t.status),
    formEmailIdx: index("submissions_form_email_idx").on(t.formId, t.email),
  })
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
  (t) => ({
    formSessionIdx: uniqueIndex("partials_form_session_idx").on(t.formId, t.sessionId),
    resumeTokenIdx: index("partials_resume_token_idx").on(t.resumeToken),
  })
);

export const destinations = sqliteTable(
  "destinations",
  {
    id: text("id").primaryKey(),
    formId: text("form_id").notNull(),
    type: text("type", { enum: ["email", "webhook", "slack", "google_sheets", "notion"] }).notNull(),
    /** type-specific: email {to, autoResponder?}, webhook {url, secret}, slack {webhookUrl} */
    config: text("config", { mode: "json" }).notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({ formIdx: index("destinations_form_idx").on(t.formId) })
);

export const destinationDeliveries = sqliteTable(
  "destination_deliveries",
  {
    id: text("id").primaryKey(),
    destinationId: text("destination_id").notNull(),
    submissionId: text("submission_id").notNull(),
    status: text("status", { enum: ["pending", "success", "failed", "retrying"] }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    lastAttemptAt: integer("last_attempt_at", { mode: "timestamp_ms" }),
    errorDetail: text("error_detail"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    destinationIdx: index("deliveries_destination_idx").on(t.destinationId),
    submissionIdx: index("deliveries_submission_idx").on(t.submissionId),
  })
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
  (t) => ({ formTypeIdx: index("form_events_form_type_idx").on(t.formId, t.eventType) })
);
