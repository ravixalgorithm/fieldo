import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, forms, submissions, formEvents, partialSubmissions, formVersions } from "@fieldo/db";
import { getFormById, updateDraft } from "@/lib/forms";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const form = getFormById(params.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ form });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getFormById(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body?.schema) return NextResponse.json({ error: "schema required" }, { status: 400 });
  try {
    const form = updateDraft(params.id, body.schema);
    return NextResponse.json({ form });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 422 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!getFormById(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.delete(submissions).where(eq(submissions.formId, params.id)).run();
  db.delete(formEvents).where(eq(formEvents.formId, params.id)).run();
  db.delete(partialSubmissions).where(eq(partialSubmissions.formId, params.id)).run();
  db.delete(formVersions).where(eq(formVersions.formId, params.id)).run();
  db.delete(forms).where(eq(forms.id, params.id)).run();
  return NextResponse.json({ ok: true });
}
