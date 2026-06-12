import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, submissions } from "@fieldo/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; sid: string } }) {
  const db = getDb();
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const where = and(eq(submissions.formId, params.id), eq(submissions.id, params.sid));
  const row = db.select().from(submissions).where(where).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "read") db.update(submissions).set({ readAt: new Date() }).where(where).run();
  else if (action === "unread") db.update(submissions).set({ readAt: null }).where(where).run();
  else if (action === "spam") db.update(submissions).set({ status: "flagged" }).where(where).run();
  else if (action === "unspam") db.update(submissions).set({ status: "complete" }).where(where).run();
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; sid: string } }) {
  const db = getDb();
  db.delete(submissions)
    .where(and(eq(submissions.formId, params.id), eq(submissions.id, params.sid)))
    .run();
  return NextResponse.json({ ok: true });
}
