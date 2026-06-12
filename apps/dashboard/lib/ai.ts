/**
 * AI form generation (PRD §5.3.8 create_form NL path).
 * Primary provider is Grok (xAI, `XAI_API_KEY`, model via `XAI_MODEL`,
 * default grok-4-fast) — cheap structured-output generation. Claude
 * (`ANTHROPIC_API_KEY`) is the secondary provider; with no key at all we
 * fall back to the deterministic keyword heuristic so local dev and tests
 * never need one. Every provider's output is re-validated by
 * parseFormSchema (logic lint included) before it can be saved.
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
  source: "grok" | "claude" | "heuristic";
}

/** Fill defaults the model omits, then validate hard (logic lint included). */
function finalize(raw: unknown, title: string | undefined, source: GeneratedForm["source"]): GeneratedForm {
  const schema = parseFormSchema({ theme: {}, settings: {}, ...(raw as object), ...(title ? { title } : {}) });
  return { schema, source };
}

const userPrompt = (description: string, title?: string) =>
  `Description: ${description}${title ? `\nRequested title: ${title}` : ""}`;

/** Grok (xAI) — OpenAI-compatible chat completions with structured output. */
async function generateWithGrok(description: string, title?: string): Promise<GeneratedForm> {
  const res = await fetch(`${process.env.XAI_BASE_URL ?? "https://api.x.ai"}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL ?? "grok-4-fast",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt(description, title) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "form_schema_v1", schema: OUTPUT_SCHEMA },
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Grok API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("Grok returned no schema");
  return finalize(JSON.parse(content), title, "grok");
}

async function generateWithClaude(description: string, title?: string): Promise<GeneratedForm> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    messages: [{ role: "user", content: userPrompt(description, title) }],
  });
  if (response.stop_reason === "refusal") {
    return { schema: schemaFromDescription(description, title), source: "heuristic" };
  }
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("AI returned no schema");
  return finalize(JSON.parse(text.text), title, "claude");
}

/**
 * Provider chain: Grok (XAI_API_KEY) → Claude (ANTHROPIC_API_KEY) → keyword
 * heuristic. Errors from a configured provider surface to the caller — a bad
 * key should be fixed, not silently masked by the heuristic.
 */
export async function generateFormSchema(description: string, title?: string): Promise<GeneratedForm> {
  if (process.env.XAI_API_KEY) return generateWithGrok(description, title);
  if (process.env.ANTHROPIC_API_KEY) return generateWithClaude(description, title);
  return { schema: schemaFromDescription(description, title), source: "heuristic" };
}
