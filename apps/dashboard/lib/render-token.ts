import crypto from "node:crypto";

const SECRET = process.env.FIELDO_TOKEN_SECRET ?? "fieldo-dev-secret-change-in-prod";

/** Signed render timestamp token issued by /meta — the spam time-trap. */
export function issueRenderToken(formId: string): string {
  const ts = Date.now().toString();
  const sig = crypto.createHmac("sha256", SECRET).update(`${formId}.${ts}`).digest("hex").slice(0, 32);
  return `${ts}.${sig}`;
}

/** Returns seconds since the token was issued, or null if missing/invalid. */
export function verifyRenderToken(formId: string, token: string | undefined | null): number | null {
  if (!token) return null;
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(`${formId}.${ts}`).digest("hex").slice(0, 32);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  const ageMs = Date.now() - Number(ts);
  if (Number.isNaN(ageMs) || ageMs < 0 || ageMs > 1000 * 60 * 60 * 24) return null;
  return Math.floor(ageMs / 1000);
}
