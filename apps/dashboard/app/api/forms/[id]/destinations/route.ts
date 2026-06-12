import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, destinations, nanoid } from "@fieldo/db";
import { getFormById } from "@/lib/forms";

export const dynamic = "force-dynamic";

const TYPES = ["email", "webhook", "slack"] as const;
type DestType = (typeof TYPES)[number];

function validateConfig(type: DestType, config: Record<string, unknown>): string | null {
  if (type === "webhook") {
    if (typeof config.url !== "string" || !/^https?:\/\//.test(config.url)) return "webhook config needs a valid url";
  } else if (type === "slack") {
    if (typeof config.webhookUrl !== "string" || !/^https?:\/\//.test(config.webhookUrl))
      return "slack config needs a valid webhookUrl";
  } else if (type === "email") {
    if (!config.autoResponder && typeof config.to !== "string") return "email config needs `to` (or autoResponder: true)";
  }
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!getFormById(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = getDb();
  const rows = db
    .select()
    .from(destinations)
    .where(eq(destinations.formId, params.id))
    .orderBy(desc(destinations.createdAt))
    .all();
  return NextResponse.json({ destinations: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getFormById(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const type = body?.type as DestType;
  const config = (body?.config ?? {}) as Record<string, unknown>;
  if (!TYPES.includes(type)) return NextResponse.json({ error: `type must be one of ${TYPES.join("|")}` }, { status: 400 });
  const configError = validateConfig(type, config);
  if (configError) return NextResponse.json({ error: configError }, { status: 400 });

  // webhook destinations get an HMAC secret generated server-side
  if (type === "webhook" && typeof config.secret !== "string") config.secret = "whsec_" + nanoid(24);

  const db = getDb();
  const row = {
    id: "dst_" + nanoid(10),
    formId: params.id,
    type,
    config,
    enabled: body?.enabled !== false,
    createdAt: new Date(),
  };
  db.insert(destinations).values(row).run();
  return NextResponse.json({ destination: row }, { status: 201 });
}
