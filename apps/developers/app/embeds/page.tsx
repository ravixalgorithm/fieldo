import type { Metadata } from "next";
import { PageHeader, Section, P, Code, C, DocTable, PageFooter, Callout, DASHBOARD_URL } from "@/components/docs";

export const metadata: Metadata = { title: "Embeds" };

export default function EmbedsPage() {
  return (
    <>
      <PageHeader title="Embeds">
        One schema, five surfaces — all rendered by the same <C>&lt;FormRenderer&gt;</C>, so behavior, validation,
        analytics beacons, and theming are identical everywhere. <C>embed_source</C> tags every submission and event
        so analytics segment by surface.
      </PageHeader>

      <Section title="1 · Framer component">
        <P>
          A real code component — actual DOM nodes in the Framer tree, no iframe. On the canvas it renders a static
          skeleton (no tracking); on the published site it hydrates the live form.
        </P>
        <DocTable
          head={["Property", "Description"]}
          rows={[
            ["Form ID", "The published form id (frm_…)."],
            ["Theme", "Dashboard (inherit your Fieldo theme) or Custom — per-instance overrides for color, font, radius, spacing."],
            ["API URL", "Advanced: self-hosted or staging origin."],
          ]}
        />
        <P>
          Font inheritance: leave the theme font as <C>inherit</C> and the form picks up your Framer site&apos;s
          typography through the CSS cascade.
        </P>
      </Section>

      <Section title="2 · Hosted page">
        <Code>{`${DASHBOARD_URL}/f/your-form-slug`}</Code>
        <P>
          SSR&apos;d, shareable, branded card layout. Append <C>?embed=1</C> to strip the chrome for iframe use.
        </P>
      </Section>

      <Section title="3 · iFrame">
        <Code>{`<iframe
  src="${DASHBOARD_URL}/f/your-form-slug?embed=1"
  style="width:100%;border:0;min-height:480px"
  loading="lazy"
></iframe>`}</Code>
      </Section>

      <Section title="4 · HTML script (embed.js)">
        <P>
          No iframe — the form is injected directly into your page&apos;s DOM right after the script tag, so it
          inherits your page fonts and can be styled with CSS variables.
        </P>
        <Code>{`<script
  src="${DASHBOARD_URL}/embed.js"
  data-form="frm_..."
></script>

<!-- optional: point at a different Fieldo origin -->
<script src=".../embed.js" data-form="frm_..." data-api="https://your-fieldo.example"></script>`}</Code>
        <P>Self-contained IIFE (React inlined, ~65 KB gzipped). Theme via <C>--fieldo-*</C> CSS variables:</P>
        <Code>{`.fieldo-embed .fieldo-form {
  --fieldo-primary: #0f766e;
  --fieldo-radius: 10px;
  --fieldo-font: inherit;
}`}</Code>
      </Section>

      <Section title="5 · React / Next.js">
        <Code>{`npm install @fieldo/react

import { FieldoForm } from "@fieldo/react";

<FieldoForm
  id="frm_..."
  apiBaseUrl="${DASHBOARD_URL}"
  onSubmitted={(submissionId) => console.log(submissionId)}
/>`}</Code>
        <P>
          Props: <C>theme</C> (token overrides), <C>fallback</C> (loading node), <C>renderError</C>. The package also
          re-exports <C>FormRenderer</C> for fully headless control and <C>fetchFormMeta</C> for custom flows.
        </P>
      </Section>

      <Section title="Schema version negotiation">
        <P>
          Embeds send <C>?supportedSchema=1</C> on the meta request. When Fieldo ships new field types, older
          installed components keep working — unknown field types are skipped with a console warning instead of
          breaking the form.
        </P>
        <Callout>
          Every surface gets the full pipeline: honeypot, signed render-token time-trap, partial capture on tab-hide,
          and field-level analytics beacons. There is nothing to wire up.
        </Callout>
      </Section>

      <PageFooter />
    </>
  );
}
