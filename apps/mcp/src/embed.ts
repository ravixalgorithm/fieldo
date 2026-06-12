/** Embed snippets for the five surfaces (PRD §5.3.7), used by generate_embed_code + scaffold_form_integration. */

export const EMBED_TARGETS = ["framer", "hosted", "iframe", "html", "react"] as const;
export type EmbedTarget = (typeof EMBED_TARGETS)[number];

export function embedCode(target: EmbedTarget, opts: { formId: string; slug: string; apiBase: string }): string {
  const { formId, slug, apiBase } = opts;
  switch (target) {
    case "framer":
      return [
        `1. Insert the "Fieldo Form" component from the Framer Marketplace`,
        `   (or paste the component module URL: ${apiBase}/component/FieldoForm.js)`,
        `2. In the properties panel set Form ID: ${formId}`,
        `3. Theme: keep "Dashboard" to inherit your Fieldo theme, or switch to "Custom" for per-instance overrides.`,
      ].join("\n");
    case "hosted":
      return `${apiBase}/f/${slug}`;
    case "iframe":
      return [
        `<iframe src="${apiBase}/f/${slug}?embed=1" style="width:100%;border:0" loading="lazy" title="Form"></iframe>`,
        `<script>addEventListener("message",e=>{if(e.data?.fieldoHeight)document.querySelector('iframe[src*="${slug}"]').style.height=e.data.fieldoHeight+"px"})</script>`,
      ].join("\n");
    case "html":
      return `<script src="${apiBase}/embed.js" data-form="${formId}"></script>`;
    case "react":
      return [
        `npm install @fieldo/react`,
        ``,
        `import { FieldoForm } from "@fieldo/react";`,
        ``,
        `<FieldoForm id="${formId}" apiBaseUrl="${apiBase}" />`,
      ].join("\n");
  }
}
