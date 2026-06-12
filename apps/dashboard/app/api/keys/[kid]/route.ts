import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, apiKeys } from "@fieldo/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { kid: string } }) {
  const ctx = requireAuth(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const key = db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, params.kid), eq(apiKeys.workspaceId, ctx.workspaceId)))
    .get();
  if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.delete(apiKeys).where(eq(apiKeys.id, params.kid)).run();
  return NextResponse.json({ ok: true });
}
