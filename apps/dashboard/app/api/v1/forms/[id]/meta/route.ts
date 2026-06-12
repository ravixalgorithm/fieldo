import { NextRequest, NextResponse } from "next/server";
import { getFormById, getFormBySlug, getPublishedSchema } from "@/lib/forms";
import { issueRenderToken } from "@/lib/render-token";
import { corsJson, corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const origin = req.headers.get("origin");
  const form = getFormById(params.id) ?? getFormBySlug(params.id);
  if (!form) return corsJson({ error: "Form not found" }, { status: 404 }, origin);
  const published = getPublishedSchema(form);
  if (!published || form.status !== "published") {
    return corsJson({ error: "Form is not published" }, { status: 410 }, origin);
  }
  return corsJson(
    {
      formId: form.id,
      schemaVersion: published.schema.schemaVersion,
      schema: published.schema,
      renderToken: issueRenderToken(form.id),
    },
    { status: 200 },
    origin,
    published.schema
  );
}
