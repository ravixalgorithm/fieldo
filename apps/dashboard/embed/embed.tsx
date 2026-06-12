/**
 * Fieldo HTML embed — <script src="https://fieldo.io/embed.js" data-form="frm_…"></script>
 * Renders the form directly into the host page DOM (no iframe), inheriting host
 * fonts via the `inherit` theme token. Bundled standalone (React inlined) by
 * `pnpm build:embed` into public/embed.js.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { FieldoForm } from "@fieldo/react";

function mount(script: HTMLScriptElement) {
  const formId = script.dataset.form;
  if (!formId) {
    console.warn("[fieldo] embed.js: missing data-form attribute");
    return;
  }
  // API origin defaults to wherever embed.js was loaded from; data-api overrides.
  const apiBaseUrl = script.dataset.api ?? new URL(script.src).origin;
  const container = document.createElement("div");
  container.className = "fieldo-embed";
  script.insertAdjacentElement("afterend", container);
  createRoot(container).render(
    <FieldoForm id={formId} apiBaseUrl={apiBaseUrl} embedSource="html" />
  );
}

const current = document.currentScript as HTMLScriptElement | null;
if (current?.dataset.form) {
  mount(current);
} else {
  // Loaded async or without data-form on the loading tag: mount every tagged script.
  const boot = () =>
    document
      .querySelectorAll<HTMLScriptElement>("script[data-form][src*='embed']")
      .forEach((s) => !s.dataset.fieldoMounted && ((s.dataset.fieldoMounted = "1"), mount(s)));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}
