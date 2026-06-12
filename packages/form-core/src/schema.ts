import { z } from "zod";

const fieldOption = z.object({ label: z.string(), value: z.string() });

const fieldValidation = z
  .object({
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    maxFiles: z.number().int().optional(),
    maxFileSizeMb: z.number().optional(),
    accept: z.string().optional(),
  })
  .partial();

export const fieldTypes = [
  "text",
  "textarea",
  "email",
  "phone",
  "url",
  "number",
  "password",
  "select",
  "radio",
  "checkbox",
  "multi-select",
  "date",
  "rating",
  "file",
  "hidden",
  "otp",
  "statement",
] as const;

export const fieldDefSchema = z.object({
  id: z.string().min(1),
  type: z.enum(fieldTypes),
  label: z.string(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().optional(),
  validation: fieldValidation.optional(),
  options: z.array(fieldOption).optional(),
  meta: z.object({ width: z.enum(["full", "half"]).optional() }).optional(),
  hiddenSource: z.string().optional(),
});

const pageSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  fields: z.array(fieldDefSchema),
});

const logicCondition = z.object({
  fieldId: z.string(),
  op: z.enum(["eq", "neq", "contains", "gt", "lt", "is_empty", "is_not_empty"]),
  value: z.unknown().optional(),
});

const logicAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("show"), fieldId: z.string() }),
  z.object({ type: z.literal("hide"), fieldId: z.string() }),
  z.object({ type: z.literal("jumpTo"), pageId: z.string() }),
  z.object({ type: z.literal("setRequired"), fieldId: z.string(), required: z.boolean() }),
]);

const logicRuleSchema = z.object({
  id: z.string(),
  when: z.object({
    all: z.array(logicCondition).optional(),
    any: z.array(logicCondition).optional(),
  }),
  then: z.array(logicAction),
});

const themeSchema = z
  .object({
    fontFamily: z.string().optional(),
    primaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    borderColor: z.string().optional(),
    borderRadius: z.string().optional(),
    spacing: z.string().optional(),
    buttonTextColor: z.string().optional(),
  })
  .partial();

const settingsSchema = z
  .object({
    submitBehavior: z
      .union([
        z.object({ type: z.literal("message"), message: z.string() }),
        z.object({ type: z.literal("redirect"), url: z.string().url() }),
      ])
      .optional(),
    notifications: z
      .object({ ownerEmail: z.string().email().optional(), autoResponder: z.boolean().optional() })
      .optional(),
    spam: z
      .object({
        honeypot: z.boolean().optional(),
        minSecondsToSubmit: z.number().optional(),
        flagThreshold: z.number().optional(),
        rejectThreshold: z.number().optional(),
      })
      .optional(),
    limits: z
      .object({
        maxResponses: z.number().int().optional(),
        openAt: z.string().optional(),
        closeAt: z.string().optional(),
      })
      .optional(),
    partials: z.object({ enabled: z.boolean().optional() }).optional(),
    dedupeByEmail: z.boolean().optional(),
    allowedOrigins: z.array(z.string()).optional(),
  })
  .partial();

export const formSchemaV1 = z.object({
  schemaVersion: z.number().int(),
  title: z.string().min(1),
  pages: z.array(pageSchema).min(1),
  logic: z.array(logicRuleSchema).default([]),
  theme: themeSchema.default({}),
  settings: settingsSchema.default({}),
});

export type ParsedFormSchema = z.infer<typeof formSchemaV1>;

/** Validate a draft/published schema. Throws ZodError on failure. */
export function parseFormSchema(input: unknown): ParsedFormSchema {
  const parsed = formSchemaV1.parse(input);
  // field ids must be unique across pages
  const ids = parsed.pages.flatMap((p) => p.fields.map((f) => f.id));
  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate field ids in schema");
  }
  return parsed;
}
