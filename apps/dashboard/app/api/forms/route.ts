import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, forms } from "@fieldo/db";
import { createForm } from "@/lib/forms";
import { requireAuth, ownsForm } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = requireAuth(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const rows = db
    .select()
    .from(forms)
    .where(eq(forms.workspaceId, ctx.workspaceId))
    .orderBy(desc(forms.updatedAt))
    .all();
  return NextResponse.json({ forms: rows });
}

export async function POST(req: NextRequest) {
  const ctx = requireAuth(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled form";
  try {
    const form = createForm(title, body.schema, ctx.workspaceId);
    return NextResponse.json({ form }, { status: 201 });
  } catch (e) {
    console.error("createForm failed:", e);
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 400 });
  }
}
