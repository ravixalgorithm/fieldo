"use client";

import { FormRenderer } from "@fieldo/renderer";
import type { EmbedSource, FormSchemaV1 } from "@fieldo/types";

export function HostedForm({
  schema,
  formId,
  renderToken,
  embedSource,
}: {
  schema: FormSchemaV1;
  formId: string;
  renderToken: string;
  embedSource: EmbedSource;
}) {
  return <FormRenderer schema={schema} formId={formId} renderToken={renderToken} embedSource={embedSource} mode="live" />;
}
