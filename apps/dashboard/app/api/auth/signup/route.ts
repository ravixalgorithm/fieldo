import { NextRequest, NextResponse } from "next/server";
import { createAccount, findUserByEmail, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : undefined;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (findUserByEmail(email)) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  const { user, workspace } = createAccount(email, password, name);
  setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name }, workspace: { id: workspace.id, name: workspace.name } }, { status: 201 });
}
