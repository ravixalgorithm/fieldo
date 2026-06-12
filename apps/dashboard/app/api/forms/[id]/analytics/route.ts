import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, formEvents, submissions } from "@fieldo/db";
import { getFormById } from "@/lib/forms";
import type { FormSchemaV1 } from "@fieldo/types";
import { requireAuth, ownsForm } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = requireAuth(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = getFormById(params.id);
  if (!owned || !ownsForm(ctx, owned)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const form = getFormById(params.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = getDb();
  const events = db.select().from(formEvents).where(eq(formEvents.formId, params.id)).all();
  const completions = db
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(eq(submissions.formId, params.id), eq(submissions.status, "complete")))
    .all().length;

  const sessions = (type: string) => new Set(events.filter((e) => e.eventType === type).map((e) => e.sessionId));
  const views = sessions("form_view").size;
  const starts = sessions("form_start").size;

  // Field-level metrics from focus/blur/error events
  const schema = form.draftSchema as FormSchemaV1;
  const fields = schema.pages.flatMap((p) => p.fields).filter((f) => f.type !== "statement" && f.type !== "hidden");
  const fieldStats = fields.map((f) => {
    const focuses = events.filter((e) => e.eventType === "field_focus" && e.fieldId === f.id);
    const blurs = events.filter((e) => e.eventType === "field_blur" && e.fieldId === f.id);
    const errors = events.filter((e) => e.eventType === "field_error" && e.fieldId === f.id);
    const reachedSessions = new Set(focuses.map((e) => e.sessionId));
    const dwells = blurs.map((e) => e.durationMs ?? 0).filter((d) => d > 0).sort((a, b) => a - b);
    const refocusBySession = new Map<string, number>();
    for (const e of focuses) refocusBySession.set(e.sessionId, (refocusBySession.get(e.sessionId) ?? 0) + 1);
    const refocusAvg = refocusBySession.size
      ? [...refocusBySession.values()].reduce((a, b) => a + b, 0) / refocusBySession.size
      : 0;
    return {
      fieldId: f.id,
      label: f.label,
      type: f.type,
      reached: reachedSessions.size,
      reachRate: starts ? reachedSessions.size / starts : 0,
      medianDwellMs: dwells.length ? dwells[Math.floor(dwells.length / 2)] : 0,
      avgRefocus: Math.round(refocusAvg * 100) / 100,
      errorCount: errors.length,
      errorRate: focuses.length ? errors.length / focuses.length : 0,
    };
  });

  return NextResponse.json({
    funnel: {
      views,
      starts,
      completions,
      startRate: views ? starts / views : 0,
      completionRate: starts ? completions / starts : 0,
    },
    fields: fieldStats,
  });
}
