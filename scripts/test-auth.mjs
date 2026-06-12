// Shared test-auth helper: signs up (or logs in) the suite user and returns
// { cookie, apiKey }. Used by the verification scripts now that the
// management API requires auth.
const BASE = process.env.FIELDO_API_URL ?? "http://localhost:3210";
const EMAIL = "suite@fieldo.test";
const PASSWORD = "fieldo-test-password";

export async function testAuth() {
  let res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: "Suite" }),
  });
  if (res.status === 409) {
    res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
  }
  if (!res.ok) throw new Error(`test auth failed: ${res.status}`);
  const setCookie = res.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];
  if (!cookie.startsWith("fieldo_session=")) throw new Error("no session cookie returned");

  const keyRes = await fetch(`${BASE}/api/keys`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ name: "verify-suite" }),
  });
  const keyData = await keyRes.json();
  if (!keyRes.ok) throw new Error(`api key create failed: ${keyRes.status}`);
  return { cookie, apiKey: keyData.key.secret, base: BASE };
}
