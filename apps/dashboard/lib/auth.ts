/**
 * Auth — zero-dependency, ported from the FrameVid pattern with hardening:
 * scrypt password hashes (salt:hash, timingSafeEqual), HMAC-SHA256-signed
 * session tokens in an httpOnly cookie, and workspace-scoped API keys
 * (sha256-hashed at rest, shown once) for MCP and integrations.
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { eq, isNull } from "drizzle-orm";
import { getDb, users, workspaces, workspaceMembers, apiKeys, forms, nanoid } from "@fieldo/db";
import { ensureDemoSeeded } from "./ensure-demo-seed";

const SECRET = process.env.FIELDO_AUTH_SECRET ?? "fieldo-dev-secret-change-in-production";
const COOKIE = "fieldo_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

/* ---------------- passwords ---------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

/* ---------------- session tokens (HMAC, stateless) ---------------- */

function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string): { uid: string; exp: number } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.uid || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_TTL_MS / 1000,
  path: "/",
};

export function setSessionCookie(userId: string) {
  cookies().set({ name: COOKIE, value: sign({ uid: userId }), ...SESSION_COOKIE_OPTS });
}

/** Prefer this in route handlers so the cookie is bound to the response object. */
export function attachSessionCookie(res: { cookies: { set: (opts: { name: string; value: string } & typeof SESSION_COOKIE_OPTS) => void } }, userId: string) {
  res.cookies.set({ name: COOKIE, value: sign({ uid: userId }), ...SESSION_COOKIE_OPTS });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

/* ---------------- accounts ---------------- */

export interface AuthContext {
  user: { id: string; email: string; name: string | null } | null; // null for API-key auth
  workspaceId: string;
  workspaceName: string;
}

export function createAccount(email: string, password: string, name?: string) {
  const db = getDb();
  const now = new Date();
  const user = { id: "usr_" + nanoid(10), email: email.toLowerCase().trim(), name: name ?? null, passwordHash: hashPassword(password), createdAt: now };
  db.insert(users).values(user).run();
  const ws = { id: "ws_" + nanoid(10), name: name ? `${name}'s workspace` : "My workspace", plan: "free", createdAt: now };
  db.insert(workspaces).values(ws).run();
  db.insert(workspaceMembers).values({ id: "mem_" + nanoid(10), workspaceId: ws.id, userId: user.id, role: "owner", createdAt: now }).run();
  // pre-auth local forms have no workspace — the first account adopts them
  db.update(forms).set({ workspaceId: ws.id }).where(isNull(forms.workspaceId)).run();
  return { user, workspace: ws };
}

export function findUserByEmail(email: string) {
  const db = getDb();
  return db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();
}

function workspaceFor(userId: string): { id: string; name: string } | null {
  const db = getDb();
  const member = db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, userId)).get();
  if (!member) return null;
  const ws = db.select().from(workspaces).where(eq(workspaces.id, member.workspaceId)).get();
  return ws ? { id: ws.id, name: ws.name } : null;
}

/* ---------------- API keys ---------------- */

export function createApiKey(workspaceId: string, name: string) {
  const db = getDb();
  const secret = "fld_" + nanoid(32);
  const row = {
    id: "key_" + nanoid(10),
    workspaceId,
    name,
    keyHash: crypto.createHash("sha256").update(secret).digest("hex"),
    prefix: secret.slice(0, 12),
    createdAt: new Date(),
  };
  db.insert(apiKeys).values(row).run();
  return { ...row, secret }; // secret is returned exactly once
}

function authByApiKey(bearer: string): AuthContext | null {
  const db = getDb();
  const hash = crypto.createHash("sha256").update(bearer).digest("hex");
  const key = db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash)).get();
  if (!key) return null;
  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id)).run();
  const ws = db.select().from(workspaces).where(eq(workspaces.id, key.workspaceId)).get();
  if (!ws) return null;
  return { user: null, workspaceId: ws.id, workspaceName: ws.name };
}

/* ---------------- request auth ---------------- */

/** Session-cookie auth for server components and routes. */
export function getAuth(): AuthContext | null {
  // Page and API routes run in separate Vercel lambdas — each needs its own DB copy.
  if (process.env.VERCEL) ensureDemoSeeded();
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const db = getDb();
  const user = db.select().from(users).where(eq(users.id, payload.uid)).get();
  if (!user) return null;
  const ws = workspaceFor(user.id);
  if (!ws) return null;
  return { user: { id: user.id, email: user.email, name: user.name }, workspaceId: ws.id, workspaceName: ws.name };
}

/** Cookie OR `Authorization: Bearer fld_…` API key. Use in management API routes. */
export function requireAuth(req: Request): AuthContext | null {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer fld_")) return authByApiKey(header.slice(7));
  return getAuth();
}

/** Guard helper: a form must belong to the caller's workspace. */
export function ownsForm(ctx: AuthContext, form: { workspaceId: string | null }): boolean {
  return form.workspaceId === ctx.workspaceId;
}
