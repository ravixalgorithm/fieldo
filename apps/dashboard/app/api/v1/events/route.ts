import { NextRequest, NextResponse } from "next/server";
import { getDb, formEvents, nanoid } from "@fieldo/db";
import { FORM_EVENT_TYPES } from "@fieldo/types";
import { rateLimit } from "@/lib/rate-limit";
import { corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

const VALID = new Set<string>(FORM_EVENT_TYPES);

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`events:${ip}`, 300, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: corsHeaders(origin) });
  }
  const body = await req.json().catch(() => null);
  const events = Array.isArray(body?.events) ? body.events.slice(0, 50) : [];
  const db = getDb();
  const deviceType = /mobile|android|iphone/i.test(req.headers.get("user-agent") ?? "") ? "mobile" : "desktop";
  let inserted = 0;
  for (const e of events) {
    if (!e?.formId || !VALID.has(e.eventType) || !e.sessionId) continue;
    db.insert(formEvents)
      .values({
        id: "evt_" + nanoid(12),
        formId: String(e.formId),
        eventType: String(e.eventType),
        fieldId: e.fieldId ? String(e.fieldId) : null,
        pageId: e.pageId ? String(e.pageId) : null,
        sessionId: String(e.sessionId),
        durationMs: typeof e.durationMs === "number" ? Math.round(e.durationMs) : null,
        deviceType,
        referrer: req.headers.get("referer"),
        embedSource: typeof e.embedSource === "string" ? e.embedSource : null,
        meta: e.meta ?? null,
        createdAt: new Date(),
      })
      .run();
    inserted++;
  }
  return NextResponse.json({ ok: true, inserted }, { headers: corsHeaders(origin) });
}
