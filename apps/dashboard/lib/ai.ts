/**
 * AI form generation (PRD §5.3.8 create_form NL path).
 * Claude (claude-opus-4-8) with a structured-output JSON schema produces a
 * FormSchemaV1; the result is re-validated by parseFormSchema (logic lint
 * included). Without ANTHROPIC_API_KEY we fall back to the deterministic
 * keyword heuristic so local dev and tests never need a key.
 */
import Anthropic from "@anthropic-ai/sdk";
import { parseFormSchema, schemaFromDescription } from "@fieldo/form-core";
import type { FormSchemaV1 } from "@fieldo/types";

const FIELD_TYPES = [
  "text", "textarea", "email", "phone", "url", "number", "password",
  "select", "radio", "checkbox", "multi-select", "date", "rating",
  "file", "hidden", "otp", "statement",
];

// Constrained mirror of FormSchemaV1 (structured outputs disallow recursion
// and require additionalProperties: false everywhere).
const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "title", "pages", "logic"],
  properties: {
    schemaVersion: { type: "integer", enum: [1] },
    title: { type: "string" },
    pages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "fields"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          fields: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "type", "label"],
              properties: {
                id: { type: "string" },
                type: { type: "string", enum: FIELD_TYPES },
                label: { type: "string" },
                placeholder: { type: "string" },
                helpText: { type: "string" },
                required: { type: "boolean" },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["label", "value"],
                    properties: { label: { type: "string" }, value: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    logic: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "when", "then"],
        properties: {
          id: { type: "string" },
          when: {
            type: "object",
            additionalProperties: false,
            properties: {
              all: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["fieldId", "op"],
                  properties: {
                    fieldId: { type: "string" },
                    op: { type: "string", enum: ["eq", "neq", "contains", "gt", "lt", "is_empty", "is_not_empty"] },
                    value: { type: "string" },
                  },
                },
              },
            },
          },
          then: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["type", "fieldId"],
              properties: {
                type: { type: "string", enum: ["show", "hide"] },
                fieldId: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;

const SYSTEM = `You design web forms for the Fieldo form platform. Given a description, produce the best FormSchemaV1 JSON for it.

Rules:
- Field ids: short snake_case prefixed "fld_" (e.g. fld_work_email); page ids "page_1", "page_2", ...
- Ask only for what the description implies; don't pad with extra fields.
- Use the most specific field type (email not text for emails; select/radio for closed choices with options; rating for satisfaction; textarea for long answers; statement for instructional text).
- Mark fields required only when the form's purpose needs them.
- Multi-page only when the description implies distinct steps or has 7+ fields.
- Conditional logic (show/hide) only when the description implies it.
- Title: short and human, no "Form" suffix unless natural.`;

export interface GeneratedForm {
  schema: FormSchemaV1;
  source: "ai" | "heuristic";
}

export async function generateFormSchema(description: string, title?: string): Promise<GeneratedForm> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { schema: schemaFromDescription(description, title), source: "heuristic" };
  }
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Description: ${description}${title ? `\nRequested title: ${title}` : ""}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") {
    return { schema: schemaFromDescription(description, title), source: "heuristic" };
  }
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("AI returned no schema");
  const raw = JSON.parse(text.text);
  // model output omits theme/settings (not in OUTPUT_SCHEMA) — fill defaults, then validate hard
  const schema = parseFormSchema({ theme: {}, settings: {}, ...raw, ...(title ? { title } : {}) });
  return { schema, source: "ai" };
}
