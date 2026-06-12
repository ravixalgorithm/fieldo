// Drives the Fieldo MCP server over stdio JSON-RPC and runs the PRD headline
// recipe plus spot checks. Requires the dashboard dev server on :3210.
// Usage: node scripts/mcp-verify.mjs
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const proc = spawn("node", [path.join(root, "apps/mcp/node_modules/tsx/dist/cli.mjs"), "src/index.ts"], {
  cwd: path.join(root, "apps/mcp"),
  stdio: ["pipe", "pipe", "inherit"],
});

let buf = "";
const pending = new Map();
proc.stdout.on("data", (c) => {
  buf += c;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});

let nextId = 1;
function rpc(method, params = {}) {
  const id = nextId++;
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  return new Promise((resolve, reject) => {
    pending.set(id, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
    setTimeout(() => pending.has(id) && (pending.delete(id), reject(new Error(`timeout: ${method}`))), 15000);
  });
}
const call = async (name, args = {}) => {
  const r = await rpc("tools/call", { name, arguments: args });
  const text = r.content?.[0]?.text ?? "{}";
  if (r.isError) throw new Error(`${name}: ${text}`);
  return JSON.parse(text);
};

let pass = 0, fail = 0;
const check = (cond, msg) => (cond ? (pass++, console.log("  PASS:", msg)) : (fail++, console.log("  FAIL:", msg)));

await rpc("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "verify", version: "0" },
});
proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

console.log("1) tools/list");
const tools = (await rpc("tools/list")).tools;
check(tools.length >= 26, `tool count ${tools.length} (PRD set)`);

console.log("2) Headline recipe");
const form = await call("create_form", {
  description: "contact form for SaaS landing page, asks name, work email, company size",
});
const labels = form.draftSchema.pages[0].fields.map((f) => f.label);
check(!!form.id, `create_form from NL -> ${form.id} [${labels.join(", ")}]`);
check(labels.includes("Name") && labels.includes("Email") && labels.includes("Company size"), "NL fields inferred");

const pub = await call("publish_form", { id: form.id });
check(pub.version === 1, "publish_form -> v1");

const embeds = await call("generate_embed_code", { id: form.id });
check(Object.keys(embeds).length === 5, "generate_embed_code -> 5 targets");
check(embeds.html.includes(`data-form="${form.id}"`), "html target references form id");

console.log("3) Schema editing tools");
const fields0 = form.draftSchema.pages[0].fields;
const withField = await call("add_field", {
  id: form.id,
  field: { type: "textarea", label: "How did you hear about us?" },
});
check(withField.draftSchema.pages[0].fields.length === fields0.length + 1, "add_field");
const newFld = withField.draftSchema.pages[0].fields.at(-1);
const removed = await call("remove_field", { id: form.id, fieldId: newFld.id });
check(removed.draftSchema.pages[0].fields.length === fields0.length, "remove_field");
const themed = await call("update_form_theme", { id: form.id, theme: { primaryColor: "#16a34a" } });
check(themed.draftSchema.theme.primaryColor === "#16a34a", "update_form_theme");

console.log("4) test_submit through real pipeline");
const emailFld = fields0.find((f) => f.type === "email").id;
const nameFld = fields0.find((f) => f.type === "text").id;
const sub = await call("test_submit", {
  id: form.id,
  answers: { [nameFld]: "MCP Tester", [emailFld]: "mcp@test.com" },
});
check(!!sub.submissionId, `test_submit -> ${sub.submissionId}`);
const bad = await call("test_submit", { id: form.id, answers: { [emailFld]: "no-name@test.com" } }).catch((e) => e.message);
check(String(bad).includes("422"), "test_submit missing required -> 422 surfaced");

console.log("5) Submissions + analytics + status");
const subs = await call("get_submissions", { id: form.id });
check(subs.length === 1 && subs[0].answers[nameFld] === "MCP Tester", "get_submissions");
const one = await call("get_submission", { id: form.id, submissionId: sub.submissionId });
check(one.readAt !== null, "test submission marked read");
const denied = await call("delete_form", { id: form.id, confirm: false }).catch((e) => e.message);
check(String(denied).includes("confirm"), "delete_form without confirm refused");
const funnel = await call("get_form_analytics", { id: form.id });
check(typeof funnel.completionRate === "number", "get_form_analytics");
const ws = await call("get_workspace_analytics", {});
check(ws.totals.forms >= 1, "get_workspace_analytics");
const insights = await call("get_friction_insights", { id: form.id });
check(Array.isArray(insights.insights), "get_friction_insights");
const status = await call("get_form_status", { id: form.id });
check(status.published === true && status.submissionCount === 1, "get_form_status");

console.log("6) Cleanup: delete_form with confirm");
const del = await call("delete_form", { id: form.id, confirm: true });
check(del.ok === true, "delete_form confirmed");

console.log(`\nResult: ${pass} passed, ${fail} failed`);
proc.kill();
process.exit(fail ? 1 : 0);
