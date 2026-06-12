/**
 * Fieldo MCP server (PRD §5.3.8) — lets agents operate the full forms
 * infrastructure: library, management, submissions, analytics, developer tools.
 * stdio transport; drives the dashboard HTTP API at FIELDO_API_URL
 * (default http://localhost:3210). Single-user local build: no OAuth yet.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from "node:module";
import type { FieldDef, FormSchemaV1 } from "@fieldo/types";

// form-core has no "type": "module", so its `export *` barrel isn't statically
// analyzable from ESM under tsx — load it through CJS interop instead.
const require = createRequire(import.meta.url);
const { parseFormSchema } = require("@fieldo/form-core") as {
  parseFormSchema: (s: unknown) => FormSchemaV1;
};
import { api, API_BASE, ApiError } from "./api.js";
import { schemaFromDescription } from "./nl.js";
import { embedCode, EMBED_TARGETS } from "./embed.js";

const server = new McpServer({ name: "fieldo", version: "0.1.0" });

type FormRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  draftSchema: FormSchemaV1;
  publishedVersionId: string | null;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
};

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const fail = (message: string) => ({
  content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
  isError: true,
});

function tool(
  name: string,
  description: string,
  shape: z.ZodRawShape,
  handler: (args: Record<string, unknown>) => Promise<unknown>
) {
  server.tool(name, description, shape, async (args: Record<string, unknown>) => {
    try {
      return ok(await handler(args));
    } catch (e) {
      if (e instanceof ApiError) return fail(`${e.status}: ${e.message}`);
      return fail(e instanceof Error ? e.message : String(e));
    }
  });
}

const getForm = (id: string) => api<{ form: FormRow }>(`/api/forms/${id}`).then((r) => r.form);
const listForms = () => api<{ forms: FormRow[] }>(`/api/forms`).then((r) => r.forms);
const saveDraft = (id: string, schema: FormSchemaV1) =>
  api<{ form: FormRow }>(`/api/forms/${id}`, { method: "PUT", body: { schema } }).then((r) => r.form);

/** Load a form, apply a draft-schema transform, validate, save. */
async function editSchema(id: string, edit: (s: FormSchemaV1) => void): Promise<FormRow> {
  const form = await getForm(id);
  const schema = structuredClone(form.draftSchema);
  edit(schema);
  return saveDraft(id, parseFormSchema(schema));
}

const summarize = (f: FormRow) => ({
  id: f.id,
  title: f.title,
  slug: f.slug,
  status: f.status,
  published: !!f.publishedVersionId,
  submissionCount: f.submissionCount,
  updatedAt: f.updatedAt,
});

// ---------------------------------------------------------------- Library

tool("list_workspaces", "List workspaces. Local single-user build has exactly one workspace.", {}, async () => [
  { id: "ws_local", name: "Local workspace", default: true },
]);

tool("list_folders", "List form folders in the workspace. Folders ship post-v1; returns the root folder.", {}, async () => [
  { id: "root", name: "All forms" },
]);

tool(
  "list_forms",
  "List forms, optionally filtered by status (draft|published|closed|archived) or a title search string.",
  { status: z.string().optional(), search: z.string().optional() },
  async ({ status, search }) => {
    let rows = await listForms();
    if (status) rows = rows.filter((f) => f.status === status);
    if (search) rows = rows.filter((f) => f.title.toLowerCase().includes(String(search).toLowerCase()));
    return rows.map(summarize);
  }
);

tool("get_form", "Get a form's full draft schema, status, and stats.", { id: z.string() }, async ({ id }) =>
  getForm(String(id))
);

tool(
  "search_forms",
  "Search forms by title, slug, or field labels.",
  { query: z.string() },
  async ({ query }) => {
    const q = String(query).toLowerCase();
    const rows = await listForms();
    return rows
      .filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.slug.includes(q) ||
          f.draftSchema.pages.some((p) => p.fields.some((fl) => fl.label.toLowerCase().includes(q)))
      )
      .map(summarize);
  }
);

// ------------------------------------------------------------- Management

tool(
  "create_form",
  "Create a form from a JSON schema (FormSchemaV1) OR a natural-language description like 'contact form for SaaS landing page, asks name, work email, company size'.",
  {
    title: z.string().optional(),
    schema: z.record(z.unknown()).optional().describe("Full FormSchemaV1 JSON"),
    description: z.string().optional().describe("Natural-language description of the form"),
  },
  async ({ title, schema, description }) => {
    const finalSchema = schema
      ? parseFormSchema(schema)
      : schemaFromDescription(String(description ?? ""), title as string | undefined);
    const r = await api<{ form: FormRow }>(`/api/forms`, {
      method: "POST",
      body: { title: title ?? finalSchema.title, schema: finalSchema },
    });
    return r.form;
  }
);

tool(
  "update_form_fields",
  "Replace a field's definition (matched by field id) in the draft schema.",
  { id: z.string(), field: z.record(z.unknown()).describe("Full FieldDef including id") },
  async ({ id, field }) =>
    editSchema(String(id), (s) => {
      const f = field as unknown as FieldDef;
      for (const page of s.pages) {
        const i = page.fields.findIndex((x) => x.id === f.id);
        if (i >= 0) {
          page.fields[i] = f;
          return;
        }
      }
      throw new Error(`Field ${f.id} not found`);
    })
);

tool(
  "add_field",
  "Add a field to the draft schema. Appends to the given page (default: last page), optionally at an index.",
  {
    id: z.string(),
    field: z.record(z.unknown()).describe("FieldDef; id generated if omitted"),
    pageId: z.string().optional(),
    index: z.number().int().optional(),
  },
  async ({ id, field, pageId, index }) =>
    editSchema(String(id), (s) => {
      const f = { id: `fld_${Math.random().toString(36).slice(2, 8)}`, ...(field as object) } as FieldDef;
      const page = pageId ? s.pages.find((p) => p.id === pageId) : s.pages[s.pages.length - 1];
      if (!page) throw new Error(`Page ${pageId} not found`);
      page.fields.splice(index === undefined ? page.fields.length : Number(index), 0, f);
    })
);

tool(
  "remove_field",
  "Remove a field from the draft schema by field id (also drops logic rules referencing it).",
  { id: z.string(), fieldId: z.string() },
  async ({ id, fieldId }) =>
    editSchema(String(id), (s) => {
      let found = false;
      for (const page of s.pages) {
        const i = page.fields.findIndex((x) => x.id === fieldId);
        if (i >= 0) {
          page.fields.splice(i, 1);
          found = true;
        }
      }
      if (!found) throw new Error(`Field ${fieldId} not found`);
      s.logic = s.logic.filter(
        (r) =>
          !(r.when.all ?? []).concat(r.when.any ?? []).some((c) => c.fieldId === fieldId) &&
          !r.then.some((a) => "fieldId" in a && a.fieldId === fieldId)
      );
    })
);

tool(
  "set_logic",
  "Replace the form's logic rules. Lints for cycles and dangling field refs before saving.",
  { id: z.string(), logic: z.array(z.record(z.unknown())) },
  async ({ id, logic }) =>
    editSchema(String(id), (s) => {
      s.logic = logic as FormSchemaV1["logic"]; // parseFormSchema lints cycles + refs
    })
);

tool(
  "update_form_settings",
  "Merge a partial settings object (submitBehavior, spam thresholds, limits, dedupeByEmail, allowedOrigins, partials, notifications) into the draft schema.",
  { id: z.string(), settings: z.record(z.unknown()) },
  async ({ id, settings }) =>
    editSchema(String(id), (s) => {
      s.settings = { ...s.settings, ...(settings as object) };
    })
);

tool(
  "update_form_theme",
  "Merge partial theme tokens (primaryColor, fontFamily, borderRadius, spacing, backgroundColor, textColor, borderColor, buttonTextColor) into the draft schema.",
  { id: z.string(), theme: z.record(z.unknown()) },
  async ({ id, theme }) =>
    editSchema(String(id), (s) => {
      s.theme = { ...s.theme, ...(theme as object) };
    })
);

tool(
  "publish_form",
  "Publish the draft as a new immutable version and point the live form at it.",
  { id: z.string() },
  async ({ id }) => api(`/api/forms/${id}/publish`, { method: "POST" })
);

tool(
  "unpublish_form",
  "Take the form offline (status back to draft; version history is kept).",
  { id: z.string() },
  async ({ id }) => api(`/api/forms/${id}/unpublish`, { method: "POST" })
);

tool(
  "duplicate_form",
  "Duplicate a form's draft schema into a new draft form.",
  { id: z.string(), title: z.string().optional() },
  async ({ id, title }) => api(`/api/forms/${id}/duplicate`, { method: "POST", body: { title } })
);

tool(
  "delete_form",
  "Permanently delete a form and ALL its submissions, versions, partials, and events. Requires confirm: true.",
  { id: z.string(), confirm: z.boolean() },
  async ({ id, confirm }) => {
    if (confirm !== true) throw new Error("Refusing to delete: pass confirm: true to delete this form and all its data.");
    return api(`/api/forms/${id}`, { method: "DELETE" });
  }
);

// ------------------------------------------------------------ Submissions

tool(
  "get_submissions",
  "List a form's submissions. Filter by status (complete|flagged|rejected) and/or search string (matches email + answers).",
  { id: z.string(), status: z.string().optional(), search: z.string().optional(), limit: z.number().int().optional() },
  async ({ id, status, search, limit }) => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", String(status));
    if (search) qs.set("search", String(search));
    const r = await api<{ submissions: unknown[] }>(`/api/forms/${id}/submissions?${qs}`);
    return r.submissions.slice(0, Number(limit ?? 100));
  }
);

tool(
  "get_submission",
  "Get a single submission by id.",
  { id: z.string(), submissionId: z.string() },
  async ({ id, submissionId }) => {
    const r = await api<{ submissions: { id: string }[] }>(`/api/forms/${id}/submissions`);
    const sub = r.submissions.find((s) => s.id === submissionId);
    if (!sub) throw new Error(`Submission ${submissionId} not found`);
    return sub;
  }
);

tool(
  "export_submissions",
  "Export a form's submissions. format: csv returns a download URL; format: json returns the rows inline.",
  { id: z.string(), format: z.enum(["csv", "json"]).optional() },
  async ({ id, format }) => {
    if ((format ?? "csv") === "json") return api(`/api/forms/${id}/submissions`);
    return { downloadUrl: `${API_BASE}/api/forms/${id}/submissions?format=csv` };
  }
);

tool(
  "get_partial_submissions",
  "List abandoned/in-progress partial submissions for a form (answers so far, last field, email if captured).",
  { id: z.string() },
  async ({ id }) => api(`/api/forms/${id}/partials`)
);

tool(
  "mark_submission",
  "Mark a submission: read | unread | spam | unspam.",
  { id: z.string(), submissionId: z.string(), action: z.enum(["read", "unread", "spam", "unspam"]) },
  async ({ id, submissionId, action }) =>
    api(`/api/forms/${id}/submissions/${submissionId}`, { method: "PATCH", body: { action } })
);

tool(
  "delete_submission",
  "Permanently delete a submission. Requires confirm: true.",
  { id: z.string(), submissionId: z.string(), confirm: z.boolean() },
  async ({ id, submissionId, confirm }) => {
    if (confirm !== true) throw new Error("Refusing to delete: pass confirm: true.");
    return api(`/api/forms/${id}/submissions/${submissionId}`, { method: "DELETE" });
  }
);

// -------------------------------------------------------------- Analytics

type Analytics = {
  funnel: { views: number; starts: number; completions: number; startRate: number; completionRate: number };
  fields: {
    fieldId: string;
    label: string;
    type: string;
    reached: number;
    reachRate: number;
    medianDwellMs: number;
    avgRefocus: number;
    errorCount: number;
    errorRate: number;
  }[];
};

tool(
  "get_form_analytics",
  "Top-level conversion metrics for a form: views, starts, completions, start/completion rates.",
  { id: z.string() },
  async ({ id }) => (await api<Analytics>(`/api/forms/${id}/analytics`)).funnel
);

tool(
  "get_field_funnel",
  "Per-field drop-off curve: reach, reach rate, median dwell, refocus, error rate for every field in order.",
  { id: z.string() },
  async ({ id }) => (await api<Analytics>(`/api/forms/${id}/analytics`)).fields
);

tool(
  "get_friction_insights",
  "Heuristic friction findings for a form: fields with high error rates, long dwell, heavy refocus, or reach cliffs, with recommendations.",
  { id: z.string() },
  async ({ id }) => {
    const a = await api<Analytics>(`/api/forms/${id}/analytics`);
    const insights: { fieldId: string; label: string; severity: "high" | "medium"; finding: string; recommendation: string }[] = [];
    let prevReach: number | null = null;
    for (const f of a.fields) {
      if (f.errorRate > 0.3 && f.errorCount >= 3)
        insights.push({
          fieldId: f.fieldId,
          label: f.label,
          severity: "high",
          finding: `${Math.round(f.errorRate * 100)}% of focuses produce a validation error`,
          recommendation: "Loosen validation, clarify the label/help text, or add a placeholder example.",
        });
      if (f.medianDwellMs > 30_000)
        insights.push({
          fieldId: f.fieldId,
          label: f.label,
          severity: "medium",
          finding: `Median dwell ${(f.medianDwellMs / 1000).toFixed(0)}s — visitors hesitate here`,
          recommendation: "Simplify the question or split it into smaller fields.",
        });
      if (f.avgRefocus > 2.5)
        insights.push({
          fieldId: f.fieldId,
          label: f.label,
          severity: "medium",
          finding: `Visitors return to this field ${f.avgRefocus}x on average`,
          recommendation: "The field may be ambiguous — add help text or an input mask.",
        });
      if (prevReach !== null && prevReach > 0 && f.reached / prevReach < 0.5 && prevReach >= 5)
        insights.push({
          fieldId: f.fieldId,
          label: f.label,
          severity: "high",
          finding: `Reach drops ${Math.round((1 - f.reached / prevReach) * 100)}% at this field`,
          recommendation: "This is your biggest drop-off cliff — consider making it optional, moving it later, or removing it.",
        });
      prevReach = f.reached;
    }
    return { insights, basedOn: a.funnel };
  }
);

tool(
  "get_workspace_analytics",
  "Aggregate conversion metrics across all forms in the workspace.",
  {},
  async () => {
    const rows = await listForms();
    const perForm = await Promise.all(
      rows.map(async (f) => ({ ...summarize(f), funnel: (await api<Analytics>(`/api/forms/${f.id}/analytics`)).funnel }))
    );
    const total = perForm.reduce(
      (acc, f) => ({
        views: acc.views + f.funnel.views,
        starts: acc.starts + f.funnel.starts,
        completions: acc.completions + f.funnel.completions,
      }),
      { views: 0, starts: 0, completions: 0 }
    );
    return { totals: { ...total, forms: rows.length }, forms: perForm };
  }
);

// -------------------------------------------------------------- Developer

tool(
  "get_form_api",
  "Endpoint URLs, schema version, and CORS config for integrating a form directly over HTTP.",
  { id: z.string() },
  async ({ id }) => {
    const form = await getForm(String(id));
    return {
      formId: form.id,
      schemaVersion: form.draftSchema.schemaVersion,
      endpoints: {
        meta: `${API_BASE}/api/v1/forms/${form.id}/meta`,
        submit: `${API_BASE}/api/v1/forms/${form.id}/submit`,
        partials: `${API_BASE}/api/v1/forms/${form.id}/partials`,
        events: `${API_BASE}/api/v1/events`,
      },
      cors: { allowedOrigins: form.draftSchema.settings.allowedOrigins ?? ["*"] },
    };
  }
);

tool(
  "generate_embed_code",
  "Generate embed code for one target or all five (framer | hosted | iframe | html | react).",
  { id: z.string(), target: z.enum([...EMBED_TARGETS, "all"]).optional() },
  async ({ id, target }) => {
    const form = await getForm(String(id));
    const opts = { formId: form.id, slug: form.slug, apiBase: API_BASE };
    const t = (target ?? "all") as string;
    if (t === "all") return Object.fromEntries(EMBED_TARGETS.map((x) => [x, embedCode(x, opts)]));
    return { [t]: embedCode(t as (typeof EMBED_TARGETS)[number], opts) };
  }
);

tool(
  "scaffold_form_integration",
  "Boilerplate integration snippet for a target surface, including a custom-submit (headless) variant for react.",
  { id: z.string(), target: z.enum([...EMBED_TARGETS]) },
  async ({ id, target }) => {
    const form = await getForm(String(id));
    const opts = { formId: form.id, slug: form.slug, apiBase: API_BASE };
    const base = embedCode(target as (typeof EMBED_TARGETS)[number], opts);
    if (target !== "react") return { snippet: base };
    return {
      snippet: base,
      headlessVariant: [
        `// Headless: fetch schema + token, post answers yourself`,
        `const meta = await fetch("${API_BASE}/api/v1/forms/${form.id}/meta?supportedSchema=1").then(r => r.json());`,
        `await fetch("${API_BASE}/api/v1/forms/${form.id}/submit", {`,
        `  method: "POST",`,
        `  headers: { "content-type": "application/json" },`,
        `  body: JSON.stringify({ renderToken: meta.renderToken, answers: { /* fieldId: value */ } }),`,
        `});`,
      ].join("\n"),
    };
  }
);

tool(
  "test_submit",
  "Submit a test payload through the real pipeline (validation, spam scoring, dedupe). The stored submission is marked read so it's easy to spot; pass answers keyed by field id.",
  { id: z.string(), answers: z.record(z.unknown()) },
  async ({ id, answers }) => {
    const meta = await api<{ renderToken: string; formId: string }>(`/api/v1/forms/${id}/meta?supportedSchema=1`);
    const result = await api<{ submissionId?: string; error?: string; errors?: unknown }>(
      `/api/v1/forms/${id}/submit`,
      { method: "POST", body: { renderToken: meta.renderToken, answers, embedSource: "react", sessionId: "mcp_test" } }
    );
    if (result.submissionId) {
      await api(`/api/forms/${meta.formId}/submissions/${result.submissionId}`, {
        method: "PATCH",
        body: { action: "read" },
      }).catch(() => null); // silently-rejected spam test payloads aren't visible to PATCH
    }
    return result;
  }
);

tool(
  "get_form_status",
  "Form status: published/draft/closed, submission count, response limits, live version.",
  { id: z.string() },
  async ({ id }) => {
    const form = await getForm(String(id));
    return {
      id: form.id,
      title: form.title,
      status: form.status,
      published: !!form.publishedVersionId,
      publishedVersionId: form.publishedVersionId,
      submissionCount: form.submissionCount,
      limits: form.draftSchema.settings.limits ?? null,
      hostedUrl: `${API_BASE}/f/${form.slug}`,
    };
  }
);

// ------------------------------------------------------------------ boot

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`fieldo-mcp ready (api: ${API_BASE})`);
