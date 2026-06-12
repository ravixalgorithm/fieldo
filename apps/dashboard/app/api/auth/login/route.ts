import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, attachSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { ensureDemoSeeded } = await import("@/lib/ensure-demo-seed");
  ensureDemoSeeded();

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const user = findUserByEmail(email);
  // identical error either way — don't leak which emails exist
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  attachSessionCookie(res, user.id);
  return res;
}
