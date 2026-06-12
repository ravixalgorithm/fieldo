import { NextRequest, NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = requireAuth(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const overview = getDashboardOverview(ctx.workspaceId, ctx.workspaceName);
  return NextResponse.json(overview);
}
