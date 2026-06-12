import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = getAuth();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ user: ctx.user, workspace: { id: ctx.workspaceId, name: ctx.workspaceName } });
}
