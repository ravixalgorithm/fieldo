import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const user = findUserByEmail(email);
  // identical error either way — don't leak which emails exist
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
