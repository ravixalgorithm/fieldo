import { NextRequest, NextResponse } from "next/server";
import { publishForm } from "@/lib/forms";
import { requireAuth, ownsForm } from "@/lib/auth";
import { getFormById } from "@/lib/forms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = requireAuth(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = getFormById(params.id);
  if (!owned || !ownsForm(ctx, owned)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const result = publishForm(params.id);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ form: result.form, version: result.version });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 422 });
  }
}
