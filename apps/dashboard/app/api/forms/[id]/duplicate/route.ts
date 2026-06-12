import { NextRequest, NextResponse } from "next/server";
import { getFormById, createForm } from "@/lib/forms";
import type { FormSchemaV1 } from "@fieldo/types";
import { requireAuth, ownsForm } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = requireAuth(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = getFormById(params.id);
  if (!owned || !ownsForm(ctx, owned)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const form = getFormById(params.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : `${form.title} (copy)`;
  const schema = { ...(form.draftSchema as FormSchemaV1), title };
  const copy = createForm(title, schema, ctx.workspaceId);
  return NextResponse.json({ form: copy }, { status: 201 });
}
