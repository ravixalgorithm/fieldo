import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, destinations, destinationDeliveries } from "@fieldo/db";

export const dynamic = "force-dynamic";

function find(formId: string, did: string) {
  const db = getDb();
  return db
    .select()
    .from(destinations)
    .where(and(eq(destinations.formId, formId), eq(destinations.id, did)))
    .get();
}

export async function GET(_req: NextRequest, { params }: { params: { id: string; did: string } }) {
  const dest = find(params.id, params.did);
  if (!dest) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = getDb();
  const deliveries = db
    .select()
    .from(destinationDeliveries)
    .where(eq(destinationDeliveries.destinationId, params.did))
    .orderBy(desc(destinationDeliveries.createdAt))
    .limit(100)
    .all();
  return NextResponse.json({ destination: dest, deliveries });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; did: string } }) {
  const dest = find(params.id, params.did);
  if (!dest) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const db = getDb();
  db.update(destinations)
    .set({
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
      ...(body.config && typeof body.config === "object" ? { config: { ...(dest.config as object), ...body.config } } : {}),
    })
    .where(eq(destinations.id, params.did))
    .run();
  return NextResponse.json({ destination: find(params.id, params.did) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; did: string } }) {
  if (!find(params.id, params.did)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = getDb();
  db.delete(destinationDeliveries).where(eq(destinationDeliveries.destinationId, params.did)).run();
  db.delete(destinations).where(eq(destinations.id, params.did)).run();
  return NextResponse.json({ ok: true });
}
