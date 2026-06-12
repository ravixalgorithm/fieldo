import { NextRequest, NextResponse } from "next/server";
import { generateFormSchema } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // AI generation can take a while

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (!description) return NextResponse.json({ error: "description required" }, { status: 400 });
  try {
    const result = await generateFormSchema(description, typeof body.title === "string" ? body.title : undefined);
    return NextResponse.json(result);
  } catch (e) {
    console.error("generate-form failed:", e);
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}
