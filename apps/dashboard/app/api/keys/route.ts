import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, apiKeys } from "@fieldo/db";
import { requireAuth, createApiKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = requireAuth(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const rows = db
    .select({ id: apiKeys.id, name: apiKeys.name, prefix: apiKeys.prefix, lastUsedAt: apiKeys.lastUsedAt, createdAt: apiKeys.createdAt })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, ctx.workspaceId))
    .orderBy(desc(apiKeys.createdAt))
    .all();
  return NextResponse.json({ keys: rows });
}

export async function POST(req: NextRequest) {
  const ctx = requireAuth(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "API key";
  const key = createApiKey(ctx.workspaceId, name);
  // `secret` is returned exactly once — only the hash is stored
  return NextResponse.json(
    { key: { id: key.id, name: key.name, prefix: key.prefix, createdAt: key.createdAt, secret: key.secret } },
    { status: 201 }
  );
}
