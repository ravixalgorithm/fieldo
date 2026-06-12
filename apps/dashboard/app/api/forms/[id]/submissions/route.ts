import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, like, or } from "drizzle-orm";
import { getDb, submissions } from "@fieldo/db";
import { getFormById } from "@/lib/forms";
import type { FormSchemaV1 } from "@fieldo/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const form = getFormById(params.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = getDb();
  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // complete|flagged|rejected
  const search = url.searchParams.get("search");
  const format = url.searchParams.get("format"); // csv

  const conds = [eq(submissions.formId, params.id)];
  if (status) conds.push(eq(submissions.status, status as "complete" | "flagged" | "rejected"));
  if (search) {
    conds.push(or(like(submissions.email, `%${search}%`), like(submissions.answers, `%${search}%`))!);
  }
  const rows = db
    .select()
    .from(submissions)
    .where(and(...conds))
    .orderBy(desc(submissions.createdAt))
    .limit(500)
    .all();

  if (format === "csv") {
    const schema = form.draftSchema as FormSchemaV1;
    const fields = schema.pages.flatMap((p) => p.fields).filter((f) => f.type !== "statement");
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["id", "created_at", "status", "email", ...fields.map((f) => f.label)].map(esc).join(",");
    const lines = rows.map((r) => {
      const a = r.answers as Record<string, unknown>;
      return [r.id, new Date(r.createdAt).toISOString(), r.status, r.email, ...fields.map((f) => {
        const v = a[f.id];
        return Array.isArray(v) ? v.join("; ") : v;
      })].map(esc).join(",");
    });
    return new NextResponse([header, ...lines].join("\n"), {
      headers: {
        "content-type": "text/csv",
        "content-disposition": `attachment; filename="${form.slug}-submissions.csv"`,
      },
    });
  }

  return NextResponse.json({ submissions: rows });
}
