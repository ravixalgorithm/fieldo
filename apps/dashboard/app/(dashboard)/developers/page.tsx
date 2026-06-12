import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHeader,
  Section,
  P,
  Code,
  C,
  DocTable,
  PageFooter,
  Callout,
  DASHBOARD_URL,
  devHref,
} from "@/components/developers/docs";

export const metadata: Metadata = { title: "Overview" };

export default function DevelopersOverviewPage() {
  return (
    <>
      <PageHeader title="Fieldo for developers & agents" breadcrumb="Overview">
        Fieldo is forms infrastructure: one schema renders natively across five surfaces, every submission lands in an
        owned inbox with field-level analytics, and the whole platform is operable by AI agents over MCP.
      </PageHeader>

      <Section title="The 90-second version">
        <P>
          You define a form once as <C>FormSchemaV1</C> — pages, 17 field types, conditional logic, theme tokens,
          spam settings. Fieldo serves it everywhere, validates server-side (logic-aware — answers injected into
          hidden fields are stripped), scores spam silently, fans out to webhooks/email/Slack, and tracks per-field
          funnel analytics.
        </P>
        <div className="docs-grid">
          <div className="docs-card">
            <h3>For AI agents</h3>
            <p>
              Connect the MCP server and your agent gets 31 tools: create forms from natural language, publish,
              read submissions, diagnose drop-off, generate embed code.{" "}
              <Link href={devHref("/mcp-server")}>Set up MCP →</Link>
            </p>
          </div>
          <div className="docs-card">
            <h3>For developers</h3>
            <p>
              A small REST surface: fetch a published schema with a signed render token, submit answers, capture
              partials, send analytics beacons. <Link href={devHref("/rest-api")}>REST API →</Link>
            </p>
          </div>
        </div>
      </Section>

      <Section title="Quickstart: form live in 3 calls">
        <P>The headline agent recipe — from a sentence to a live, embeddable form:</P>
        <Code>{`create_form({ description: "contact form for a SaaS landing page,
              asks name, work email, company size" })
→ publish_form({ id: "frm_..." })
→ generate_embed_code({ id: "frm_...", target: "framer" })`}</Code>
        <P>
          Or over HTTP: <C>POST /api/forms</C> with a schema, <C>POST /api/forms/:id/publish</C>, then drop{" "}
          <C>{`<script src="${DASHBOARD_URL}/embed.js" data-form="frm_..."></script>`}</C> into any page.
        </P>
      </Section>

      <Section title="Surfaces">
        <DocTable
          head={["Surface", "What it is"]}
          rows={[
            ["Framer component", "Native rendering in the Framer canvas and published sites — no iframe, inherits design tokens."],
            ["Hosted page", "Shareable /f/:slug page, SSR, ?embed=1 for chrome-less iframes."],
            ["embed.js", "One script tag injects the form into any HTML page's real DOM."],
            ["@fieldo/react", "<FieldoForm id=\"...\" /> for React and Next.js apps."],
            ["MCP", "31 tools for AI agents — the full forms infrastructure, not just CRUD."],
          ]}
        />
      </Section>

      <Section title="Architecture at a glance">
        <Code>{`schema (FormSchemaV1, versioned, immutable on publish)
   │
   ├─ render:  Framer component · hosted page · embed.js · @fieldo/react
   │           └─ GET /api/v1/forms/:id/meta  → schema + signed render token
   │
   ├─ submit:  POST /api/v1/forms/:id/submit
   │           limits → rate limit → spam score (honeypot, time-trap, heuristics)
   │           → logic-aware validation → dedupe → store → fan-out
   │
   ├─ fan-out: HMAC-signed webhooks · email (Resend) · Slack — retried, audited
   │
   └─ observe: inbox · spam folder · field-level funnel (reach, dwell,
               refocus, error rate) · MCP analytics tools`}</Code>
        <Callout>
          The demo workspace uses the same API surface as production. Sign in to the dashboard, create an API key
          under Settings, and point the MCP server at <C>{DASHBOARD_URL}</C>.
        </Callout>
      </Section>

      <PageFooter />
    </>
  );
}
