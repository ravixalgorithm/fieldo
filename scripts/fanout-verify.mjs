// Fan-out verification: webhook delivery + HMAC, retry/backoff on a failing
// endpoint, email-without-key failure audit, and test_submit exclusion.
// Requires dashboard on :3210 started with FANOUT_RETRY_BASE_MS=1000.
import http from "node:http";
import crypto from "node:crypto";
import { testAuth } from "./test-auth.mjs";

const BASE = "http://localhost:3210";
const { cookie } = await testAuth();
let pass = 0, fail = 0;
const check = (c, m) => (c ? (pass++, console.log("  PASS:", m)) : (fail++, console.log("  FAIL:", m)));
const api = async (path, init) => {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { cookie, ...(init?.body ? { "content-type": "application/json" } : {}) },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Local webhook receiver: /ok records and 200s; /flaky fails twice then succeeds.
const received = [];
let flakyHits = 0;
const receiver = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (req.url === "/flaky") {
      flakyHits++;
      if (flakyHits <= 2) {
        res.statusCode = 500;
        return res.end("nope");
      }
    }
    received.push({ url: req.url, body, signature: req.headers["x-fieldo-signature"] });
    res.end("ok");
  });
});
await new Promise((r) => receiver.listen(8078, r));

console.log("1) Create + publish form, attach destinations");
const schema = {
  schemaVersion: 1,
  title: "Fanout Test",
  pages: [{ id: "page_1", fields: [
    { id: "fld_name", type: "text", label: "Name", required: true },
    { id: "fld_email", type: "email", label: "Email", required: true },
  ]}],
  logic: [], theme: {},
  settings: { spam: { minSecondsToSubmit: 0 } },
};
const form = (await api("/api/forms", { method: "POST", body: { title: "Fanout Test", schema } })).data.form;
await api(`/api/forms/${form.id}/publish`, { method: "POST" });

const okDest = (await api(`/api/forms/${form.id}/destinations`, {
  method: "POST", body: { type: "webhook", config: { url: "http://localhost:8078/ok" } },
})).data.destination;
check(okDest.config.secret?.startsWith("whsec_"), "webhook secret auto-generated");
const flakyDest = (await api(`/api/forms/${form.id}/destinations`, {
  method: "POST", body: { type: "webhook", config: { url: "http://localhost:8078/flaky" } },
})).data.destination;
const emailDest = (await api(`/api/forms/${form.id}/destinations`, {
  method: "POST", body: { type: "email", config: { to: "owner@example.com" } },
})).data.destination;
const badType = await api(`/api/forms/${form.id}/destinations`, { method: "POST", body: { type: "webhook", config: {} } });
check(badType.status === 400, "invalid webhook config rejected");

console.log("2) Submit and await deliveries (flaky retries 1s + 5s)");
const meta = (await api(`/api/v1/forms/${form.id}/meta`)).data;
const submit = (await api(`/api/v1/forms/${form.id}/submit`, {
  method: "POST",
  body: { renderToken: meta.renderToken, answers: { fld_name: "Fan Out", fld_email: "fan@out.com" } },
})).data;
check(!!submit.submissionId, `submitted ${submit.submissionId}`);
await sleep(8000);

const okHit = received.find((r) => r.url === "/ok");
check(!!okHit, "webhook /ok received payload");
if (okHit) {
  const payload = JSON.parse(okHit.body);
  check(payload.event === "submission.created" && payload.answers.fld_name === "Fan Out", "payload shape");
  const expected = "sha256=" + crypto.createHmac("sha256", okDest.config.secret).update(okHit.body).digest("hex");
  check(okHit.signature === expected, "HMAC signature verifies");
}
check(flakyHits === 3 && received.some((r) => r.url === "/flaky"), `flaky endpoint retried to success (${flakyHits} hits)`);

const okAudit = (await api(`/api/forms/${form.id}/destinations/${okDest.id}`)).data.deliveries[0];
check(okAudit?.status === "success" && okAudit.attempts === 1, "ok delivery audit: success on attempt 1");
const flakyAudit = (await api(`/api/forms/${form.id}/destinations/${flakyDest.id}`)).data.deliveries[0];
check(flakyAudit?.status === "success" && flakyAudit.attempts === 3, `flaky audit: success on attempt 3`);
const emailAudit = (await api(`/api/forms/${form.id}/destinations/${emailDest.id}`)).data.deliveries[0];
check(
  ["retrying", "failed"].includes(emailAudit?.status) && /RESEND_API_KEY/.test(emailAudit?.errorDetail ?? ""),
  "email without API key audited as failing with clear reason"
);

console.log("3) test_submit session excluded from fan-out");
const before = received.length;
const meta2 = (await api(`/api/v1/forms/${form.id}/meta`)).data;
await api(`/api/v1/forms/${form.id}/submit`, {
  method: "POST",
  body: { renderToken: meta2.renderToken, sessionId: "mcp_test", answers: { fld_name: "Test", fld_email: "t@t.com" } },
});
await sleep(2500);
check(received.length === before, "no webhook fired for mcp_test session");

console.log("4) Disabled destination skipped");
await api(`/api/forms/${form.id}/destinations/${okDest.id}`, { method: "PATCH", body: { enabled: false } });
const before2 = received.filter((r) => r.url === "/ok").length;
const meta3 = (await api(`/api/v1/forms/${form.id}/meta`)).data;
await api(`/api/v1/forms/${form.id}/submit`, {
  method: "POST",
  body: { renderToken: meta3.renderToken, answers: { fld_name: "Two", fld_email: "two@out.com" } },
});
await sleep(2500);
check(received.filter((r) => r.url === "/ok").length === before2, "disabled destination not delivered");

console.log("5) Cleanup");
const del = await api(`/api/forms/${form.id}`, { method: "DELETE" });
check(del.data?.ok === true, "form + destinations deleted");

receiver.close();
console.log(`\nResult: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
