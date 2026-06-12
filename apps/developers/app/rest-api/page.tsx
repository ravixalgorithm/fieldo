import type { Metadata } from "next";
import { PageHeader, Section, P, Code, C, DocTable, PageFooter, Callout, DASHBOARD_URL } from "@/components/docs";

export const metadata: Metadata = { title: "REST API" };

export default function RestApiPage() {
  return (
    <>
      <PageHeader title="REST API">
        Two surfaces: a public v1 API your embeds (or your own renderer) talk to, and an internal management API the
        dashboard and MCP server share. Base URL: <C>{DASHBOARD_URL}</C>.
      </PageHeader>

      <Section title="Public API (v1)">
        <P>CORS is open by default and restrictable per form via <C>settings.allowedOrigins</C>.</P>
        <DocTable
          head={["Endpoint", "Description"]}
          rows={[
            ["GET /api/v1/forms/:id/meta", "Published schema + a signed render token. Accepts ?supportedSchema=N for version negotiation. :id is a form id or slug."],
            ["POST /api/v1/forms/:id/submit", "Submit answers. Runs the full pipeline: limits, rate-limit, spam scoring, logic-aware validation, dedupe, fan-out."],
            ["POST /api/v1/forms/:id/partials", "Upsert an in-progress submission by sessionId; returns a resume token."],
            ["POST /api/v1/events", "Analytics beacons: form_view, form_start, field_focus, field_blur, field_error, page_next, form_abandon…"],
          ]}
        />
        <h3>Headless submit</h3>
        <Code>{`const meta = await fetch("${DASHBOARD_URL}/api/v1/forms/FORM_ID/meta?supportedSchema=1")
  .then(r => r.json());

const res = await fetch("${DASHBOARD_URL}/api/v1/forms/FORM_ID/submit", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    renderToken: meta.renderToken,     // time-trap: forms submitted too fast are spam-scored
    answers: { fld_name: "Ada", fld_email: "ada@example.com" },
  }),
});
// 200 { submissionId, behavior }   422 { errors }   409 duplicate email   410 closed`}</Code>
        <Callout>
          Spam rejections return a <strong>fake 200</strong> with a submission id — bots learn nothing. The entry is
          stored with <C>status: rejected</C> for audit in the spam folder.
        </Callout>
      </Section>

      <Section title="Management API">
        <P>Single-user local build: unauthenticated today, OAuth-scoped when hosted. The MCP tools wrap these.</P>
        <DocTable
          head={["Endpoint", "Description"]}
          rows={[
            ["GET/POST /api/forms", "List forms · create a form (title + optional schema)."],
            ["GET/PUT/DELETE /api/forms/:id", "Read · save draft schema (validated) · delete with full cascade."],
            ["POST /api/forms/:id/publish", "Snapshot draft → immutable version, repoint live."],
            ["POST /api/forms/:id/unpublish", "Back to draft; history kept."],
            ["POST /api/forms/:id/duplicate", "Copy draft into a new form."],
            ["GET /api/forms/:id/submissions", "List + search; ?status= filter; ?format=csv for export."],
            ["PATCH/DELETE /api/forms/:id/submissions/:sid", "Mark read/unread/spam/unspam · delete."],
            ["GET /api/forms/:id/analytics", "Funnel + per-field metrics (reach, dwell, refocus, error rate)."],
            ["GET /api/forms/:id/partials", "Abandoned in-progress submissions."],
            ["GET/POST /api/forms/:id/destinations", "List · add fan-out destination (email | webhook | slack)."],
            ["GET/PATCH/DELETE /api/forms/:id/destinations/:did", "Inspect (incl. delivery audit) · toggle/edit · remove."],
            ["POST /api/ai/generate-form", "Natural language → validated FormSchemaV1 (Grok → Claude → heuristic)."],
          ]}
        />
      </Section>

      <Section title="Webhooks">
        <P>
          Add a <C>webhook</C> destination to a form and Fieldo POSTs every clean submission to your URL. A secret
          (<C>whsec_…</C>) is generated when you create the destination. Deliveries retry with exponential backoff
          (3 attempts) and every attempt is audited.
        </P>
        <Code>{`POST your-endpoint
content-type: application/json
x-fieldo-signature: sha256=<hex>

{
  "event": "submission.created",
  "submissionId": "sub_...", "formId": "frm_...", "formTitle": "Contact",
  "answers": { "fld_name": "Ada" }, "email": "ada@example.com",
  "createdAt": "2026-06-12T10:00:00.000Z", "embedSource": "framer"
}`}</Code>
        <h3>Verify the signature (Node)</h3>
        <Code>{`import crypto from "node:crypto";

function verify(rawBody: string, header: string, secret: string) {
  const expected = "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}`}</Code>
        <P>
          Zapier and Make connect through this webhook — no native node needed. Flagged-as-spam submissions do{" "}
          <strong>not</strong> fan out until a human recovers them from the spam folder.
        </P>
      </Section>

      <Section title="Spam pipeline reference">
        <DocTable
          head={["Signal", "Score", "Notes"]}
          rows={[
            ["Honeypot filled", "+1.0", "Hidden _fieldo_website field — humans never see it."],
            ["Missing/invalid render token", "+0.6", "Token is issued by /meta and signed server-side."],
            ["Submitted too fast", "+0.6", "Under settings.spam.minSecondsToSubmit (default 3s)."],
            ["Disposable email domain", "+0.3", "mailinator, yopmail, temp-mail, and friends."],
            ["3+ links or spam keywords", "+0.2", "Heuristic over all text answers."],
          ]}
        />
        <P>
          Default thresholds: flag at <C>0.5</C> (goes to spam folder), silently reject at <C>1.0</C> — both
          configurable per form via <C>settings.spam</C>.
        </P>
      </Section>

      <PageFooter />
    </>
  );
}
