import type { Answers, AnswerValue, FieldDef, FormSchemaV1 } from "@fieldo/types";
import { evaluateLogic } from "./logic";

export interface ValidationResult {
  ok: boolean;
  /** fieldId -> error message */
  errors: Record<string, string>;
  /** answers with logic-hidden fields stripped (server security) */
  cleanAnswers: Answers;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;
const PHONE_RE = /^[+\d][\d\s\-().]{5,}$/;

function isBlank(v: AnswerValue | undefined): boolean {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

function validateField(field: FieldDef, value: AnswerValue | undefined, required: boolean): string | null {
  if (isBlank(value)) {
    return required ? "This field is required" : null;
  }
  const v = field.validation ?? {};
  const s = typeof value === "string" ? value : String(value);

  switch (field.type) {
    case "email":
      if (!EMAIL_RE.test(s)) return "Enter a valid email address";
      break;
    case "url":
      if (!URL_RE.test(s)) return "Enter a valid URL";
      break;
    case "phone":
      if (!PHONE_RE.test(s)) return "Enter a valid phone number";
      break;
    case "number": {
      const n = Number(value);
      if (Number.isNaN(n)) return "Enter a number";
      if (v.min !== undefined && n < v.min) return `Must be at least ${v.min}`;
      if (v.max !== undefined && n > v.max) return `Must be at most ${v.max}`;
      break;
    }
    case "rating": {
      const n = Number(value);
      const max = v.max ?? 5;
      if (Number.isNaN(n) || n < 1 || n > max) return `Rating must be 1–${max}`;
      break;
    }
    case "select":
    case "radio": {
      const allowed = (field.options ?? []).map((o) => o.value);
      if (allowed.length && !allowed.includes(s)) return "Invalid option";
      break;
    }
    case "multi-select":
    case "checkbox": {
      if (field.type === "checkbox" && !field.options?.length) break; // single boolean checkbox
      const allowed = (field.options ?? []).map((o) => o.value);
      const arr = Array.isArray(value) ? value : [s];
      if (allowed.length && arr.some((x) => !allowed.includes(String(x)))) return "Invalid option";
      break;
    }
    case "date":
      if (Number.isNaN(Date.parse(s))) return "Enter a valid date";
      break;
  }

  if (typeof value === "string") {
    if (v.minLength !== undefined && value.length < v.minLength) return `Must be at least ${v.minLength} characters`;
    if (v.maxLength !== undefined && value.length > v.maxLength) return `Must be at most ${v.maxLength} characters`;
    if (v.pattern) {
      try {
        if (!new RegExp(v.pattern).test(value)) return "Invalid format";
      } catch {
        /* bad pattern in schema — ignore */
      }
    }
  }
  return null;
}

/**
 * Logic-aware validation. Used by the renderer per page and the server on submit.
 * Server security: answers for logic-hidden fields are STRIPPED, and hidden
 * required fields are exempted.
 */
export function validateSubmission(schema: FormSchemaV1, answers: Answers): ValidationResult {
  const logic = evaluateLogic(schema, answers);
  const errors: Record<string, string> = {};
  const cleanAnswers: Answers = {};

  for (const page of schema.pages) {
    for (const field of page.fields) {
      if (field.type === "statement") continue;
      const visible = logic.visibleFieldIds.has(field.id);
      const value = answers[field.id];
      if (!visible) continue; // strip injected hidden-field answers
      const required = logic.requiredOverrides.get(field.id) ?? field.required ?? false;
      const err = validateField(field, value, required && field.type !== "hidden");
      if (err) errors[field.id] = err;
      if (!isBlank(value)) cleanAnswers[field.id] = value as AnswerValue;
    }
  }
  return { ok: Object.keys(errors).length === 0, errors, cleanAnswers };
}

/** Pull the first email-type answer out, for denormalized search/dedupe. */
export function extractEmail(schema: FormSchemaV1, answers: Answers): string | null {
  for (const page of schema.pages) {
    for (const field of page.fields) {
      if (field.type === "email") {
        const v = answers[field.id];
        if (typeof v === "string" && v) return v.toLowerCase();
      }
    }
  }
  return null;
}
