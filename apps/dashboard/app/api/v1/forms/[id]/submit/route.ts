import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb, submissions, forms, partialSubmissions, nanoid } from "@fieldo/db";
import { validateSubmission, extractEmail, scoreSubmission, HONEYPOT_FIELD_NAME } from "@fieldo/form-core";
import type { Answers } from "@fieldo/types";
import { getFormById, getFormBySlug, getPublishedSchema } from "@/lib/forms";
import { verifyRenderToken } from "@/lib/render-token";
import { rateLimit } from "@/lib/rate-limit";
import { corsJson, corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const origin = req.headers.get("origin");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  // 1. Load published version
  const form = getFormById(params.id) ?? getFormBySlug(params.id);
  if (!form) return corsJson({ error: "Form not found" }, { status: 404 }, origin);
  const published = getPublishedSchema(form);
  if (!published || form.status === "archived") {
    return corsJson({ error: "Form is not accepting submissions" }, { status: 410 }, origin);
  }
  const schema = published.schema;
  const limits = schema.settings.limits ?? {};
  const now = Date.now();
  if (
    form.status === "closed" ||
    (limits.maxResponses && form.submissionCount >= limits.maxResponses) ||
    (limits.openAt && now < Date.parse(limits.openAt)) ||
    (limits.closeAt && now > Date.parse(limits.closeAt))
  ) {
    return corsJson({ error: "This form is closed" }, { status: 410 }, origin, schema);
  }

  // 2. Rate limit (per IP+form and per form)
  if (!rateLimit(`submit:${form.id}:${ip}`, 10, 60_000) || !rateLimit(`submit:${form.id}`, 300, 60_000)) {
    return corsJson({ error: "Too many requests" }, { status: 429 }, origin, schema);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return corsJson({ error: "Invalid body" }, { status: 400 }, origin, schema);
  const answers: Answers = body.answers ?? {};

  // 3. Spam scoring
  const verdict = scoreSubmission({
    honeypotValue: body[HONEYPOT_FIELD_NAME],
    secondsSinceRender: verifyRenderToken(form.id, body.renderToken),
    answers,
    schema,
  });

  const db = getDb();
  const meta = {
    sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
    referrer: req.headers.get("referer"),
    countryCode: req.headers.get("cf-ipcountry") ?? null,
    deviceType: /mobile|android|iphone/i.test(req.headers.get("user-agent") ?? "") ? "mobile" : "desktop",
    userAgent: req.headers.get("user-agent"),
    embedSource: ["framer", "hosted", "iframe", "react", "html"].includes(body.embedSource) ? body.embedSource : "hosted",
    timeToCompleteMs: typeof body.timeToCompleteMs === "number" ? Math.round(body.timeToCompleteMs) : null,
  };

  if (verdict.status === "reject") {
    // Silent reject: bots learn nothing. Stored with status=rejected for audit.
    db.insert(submissions)
      .values({
        id: "sub_" + nanoid(12),
        formId: form.id,
        formVersionId: published.versionId,
        answers,
        email: extractEmail(schema, answers),
        spamScore: verdict.score,
        spamSignals: verdict.signals,
        status: "rejected",
        createdAt: new Date(),
        ...meta,
      })
      .run();
    return corsJson({ submissionId: "sub_" + nanoid(12), behavior: schema.settings.submitBehavior ?? null }, { status: 200 }, origin, schema);
  }

  // 4. Server re-validation (logic-aware: strips logic-hidden answers)
  const result = validateSubmission(schema, answers);
  if (!result.ok) {
    return corsJson({ error: "Validation failed", errors: result.errors }, { status: 422 }, origin, schema);
  }

  // 6. Dedupe by email
  const email = extractEmail(schema, result.cleanAnswers);
  let dedupeKey: string | null = null;
  if (schema.settings.dedupeByEmail && email) {
    dedupeKey = crypto.createHash("sha256").update(email).digest("hex");
    const dup = db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(eq(submissions.formId, form.id), eq(submissions.dedupeKey, dedupeKey)))
      .get();
    if (dup) return corsJson({ error: "You have already submitted this form" }, { status: 409 }, origin, schema);
  }

  // 7. Insert + counter + delete matching partial
  const submissionId = "sub_" + nanoid(12);
  db.insert(submissions)
    .values({
      id: submissionId,
      formId: form.id,
      formVersionId: published.versionId,
      answers: result.cleanAnswers,
      email,
      spamScore: verdict.score,
      spamSignals: verdict.signals,
      status: verdict.status === "flag" ? "flagged" : "complete",
      dedupeKey,
      createdAt: new Date(),
      ...meta,
    })
    .run();
  db.update(forms)
    .set({ submissionCount: form.submissionCount + 1 })
    .where(eq(forms.id, form.id))
    .run();
  if (meta.sessionId) {
    db.delete(partialSubmissions)
      .where(and(eq(partialSubmissions.formId, form.id), eq(partialSubmissions.sessionId, meta.sessionId)))
      .run();
  }

  // 8. Fan-out (email/webhook) is the worker's job — queued here when configured.

  return corsJson(
    { submissionId, behavior: schema.settings.submitBehavior ?? { type: "message", message: "Thanks — your response has been recorded." } },
    { status: 200 },
    origin,
    schema
  );
}
