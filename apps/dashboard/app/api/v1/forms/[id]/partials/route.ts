import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, partialSubmissions, nanoid } from "@fieldo/db";
import { extractEmail } from "@fieldo/form-core";
import { getFormById, getFormBySlug, getPublishedSchema } from "@/lib/forms";
import { rateLimit } from "@/lib/rate-limit";
import { corsJson, corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const origin = req.headers.get("origin");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`partials:${params.id}:${ip}`, 60, 60_000)) {
    return corsJson({ error: "Too many requests" }, { status: 429 }, origin);
  }
  const form = getFormById(params.id) ?? getFormBySlug(params.id);
  if (!form) return corsJson({ error: "Form not found" }, { status: 404 }, origin);
  const published = getPublishedSchema(form);
  if (!published || published.schema.settings.partials?.enabled === false) {
    return corsJson({ ok: false }, { status: 200 }, origin);
  }
  const body = await req.json().catch(() => null);
  if (!body?.sessionId || typeof body.answers !== "object") {
    return corsJson({ error: "sessionId and answers required" }, { status: 400 }, origin);
  }
  const db = getDb();
  const nowDate = new Date();
  const email = extractEmail(published.schema, body.answers);
  const existing = db
    .select()
    .from(partialSubmissions)
    .where(and(eq(partialSubmissions.formId, form.id), eq(partialSubmissions.sessionId, body.sessionId)))
    .get();
  let resumeToken: string;
  if (existing) {
    resumeToken = existing.resumeToken;
    db.update(partialSubmissions)
      .set({ answers: body.answers, email: email ?? existing.email, lastFieldId: body.lastFieldId ?? existing.lastFieldId, updatedAt: nowDate })
      .where(eq(partialSubmissions.id, existing.id))
      .run();
  } else {
    resumeToken = nanoid(21);
    db.insert(partialSubmissions)
      .values({
        id: "prt_" + nanoid(10),
        formId: form.id,
        sessionId: body.sessionId,
        answers: body.answers,
        email,
        lastFieldId: body.lastFieldId ?? null,
        resumeToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        createdAt: nowDate,
        updatedAt: nowDate,
      })
      .run();
  }
  return corsJson({ ok: true, resumeToken }, { status: 200 }, origin, published.schema);
}
