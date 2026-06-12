import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, partialSubmissions } from "@fieldo/db";
import { getFormById } from "@/lib/forms";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!getFormById(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = getDb();
  const rows = db
    .select()
    .from(partialSubmissions)
    .where(eq(partialSubmissions.formId, params.id))
    .orderBy(desc(partialSubmissions.updatedAt))
    .limit(500)
    .all();
  // resume tokens are capability secrets for visitors; the owner view doesn't need them
  return NextResponse.json({ partials: rows.map(({ resumeToken: _rt, ...r }) => r) });
}
