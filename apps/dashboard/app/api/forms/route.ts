import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, forms } from "@fieldo/db";
import { createForm } from "@/lib/forms";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db.select().from(forms).orderBy(desc(forms.updatedAt)).all();
  return NextResponse.json({ forms: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled form";
  try {
    const form = createForm(title, body.schema);
    return NextResponse.json({ form }, { status: 201 });
  } catch (e) {
    console.error("createForm failed:", e);
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 400 });
  }
}
