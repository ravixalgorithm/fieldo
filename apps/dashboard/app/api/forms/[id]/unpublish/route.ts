import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, forms } from "@fieldo/db";
import { getFormById } from "@/lib/forms";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const form = getFormById(params.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = getDb();
  // Versions stay (immutable history); the live pointer is cleared.
  db.update(forms)
    .set({ status: "draft", publishedVersionId: null, updatedAt: new Date() })
    .where(eq(forms.id, params.id))
    .run();
  return NextResponse.json({ form: getFormById(params.id) });
}
