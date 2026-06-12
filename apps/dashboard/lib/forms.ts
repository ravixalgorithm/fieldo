import { eq } from "drizzle-orm";
import { getDb, forms, formVersions, nanoid } from "@fieldo/db";
import { parseFormSchema } from "@fieldo/form-core";
import type { FormSchemaV1 } from "@fieldo/types";

export function getFormById(id: string) {
  const db = getDb();
  return db.select().from(forms).where(eq(forms.id, id)).get();
}

export function getFormBySlug(slug: string) {
  const db = getDb();
  return db.select().from(forms).where(eq(forms.slug, slug)).get();
}

export function getPublishedSchema(form: { publishedVersionId: string | null }): { schema: FormSchemaV1; versionId: string } | null {
  if (!form.publishedVersionId) return null;
  const db = getDb();
  const v = db.select().from(formVersions).where(eq(formVersions.id, form.publishedVersionId)).get();
  if (!v) return null;
  return { schema: v.schema as FormSchemaV1, versionId: v.id };
}

export function createForm(title: string, schema?: unknown, workspaceId?: string) {
  const db = getDb();
  const now = new Date();
  const id = "frm_" + nanoid(10);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) + "-" + nanoid(4).toLowerCase();
  const draft: FormSchemaV1 = schema
    ? (parseFormSchema(schema) as FormSchemaV1)
    : {
        schemaVersion: 1,
        title,
        pages: [{ id: "page_1", fields: [] }],
        logic: [],
        theme: {},
        settings: {},
      };
  db.insert(forms)
    .values({ id, workspaceId: workspaceId ?? null, title, slug, status: "draft", draftSchema: draft, createdAt: now, updatedAt: now })
    .run();
  return getFormById(id)!;
}

export function updateDraft(id: string, schema: unknown) {
  const parsed = parseFormSchema(schema);
  const db = getDb();
  db.update(forms)
    .set({ draftSchema: parsed, title: parsed.title, updatedAt: new Date() })
    .where(eq(forms.id, id))
    .run();
  return getFormById(id)!;
}

/** Publish = snapshot draft into immutable form_versions + repoint. */
export function publishForm(id: string) {
  const db = getDb();
  const form = getFormById(id);
  if (!form) return null;
  const schema = parseFormSchema(form.draftSchema);
  const existing = db.select().from(formVersions).where(eq(formVersions.formId, id)).all();
  const version = existing.length + 1;
  const versionId = "fv_" + nanoid(10);
  db.insert(formVersions)
    .values({ id: versionId, formId: id, version, schema, schemaVersion: schema.schemaVersion, publishedAt: new Date() })
    .run();
  db.update(forms)
    .set({ publishedVersionId: versionId, status: "published", updatedAt: new Date() })
    .where(eq(forms.id, id))
    .run();
  return { form: getFormById(id)!, version };
}
