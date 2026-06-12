"use client";

import React, { useEffect, useState } from "react";
import { FormRenderer } from "@fieldo/renderer";
import type { EmbedSource, FormSchemaV1, ThemeTokens } from "@fieldo/types";

export { FormRenderer } from "@fieldo/renderer";
export type { FormRendererProps } from "@fieldo/renderer";

export const SUPPORTED_SCHEMA_VERSION = 1;

export interface FormMeta {
  formId: string;
  schemaVersion: number;
  schema: FormSchemaV1;
  renderToken: string;
}

export async function fetchFormMeta(id: string, apiBaseUrl = ""): Promise<FormMeta> {
  const res = await fetch(`${apiBaseUrl}/api/v1/forms/${id}/meta?supportedSchema=${SUPPORTED_SCHEMA_VERSION}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to load form (${res.status})`);
  }
  return res.json();
}

export interface FieldoFormProps {
  /** published form id or slug */
  id: string;
  /** origin of the Fieldo API, e.g. https://fieldo.io — defaults to same-origin */
  apiBaseUrl?: string;
  theme?: ThemeTokens;
  embedSource?: EmbedSource;
  onSubmitted?: (submissionId: string) => void;
  /** rendered while the schema is loading */
  fallback?: React.ReactNode;
  /** rendered when the form can't be loaded; receives the error message */
  renderError?: (message: string) => React.ReactNode;
}

/** Fetches the published schema + render token, then renders the shared <FormRenderer>. */
export function FieldoForm({
  id,
  apiBaseUrl = "",
  theme,
  embedSource = "react",
  onSubmitted,
  fallback = null,
  renderError,
}: FieldoFormProps) {
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMeta(null);
    setError(null);
    fetchFormMeta(id, apiBaseUrl)
      .then((m) => !cancelled && setMeta(m))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [id, apiBaseUrl]);

  if (error) return <>{renderError ? renderError(error) : <div className="fieldo-load-error">{error}</div>}</>;
  if (!meta) return <>{fallback}</>;
  return (
    <FormRenderer
      schema={meta.schema}
      formId={meta.formId}
      apiBaseUrl={apiBaseUrl}
      renderToken={meta.renderToken}
      embedSource={embedSource}
      mode="live"
      theme={theme}
      onSubmitted={onSubmitted}
    />
  );
}
