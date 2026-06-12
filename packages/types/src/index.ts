// FormSchemaV1 — the single contract between builder, renderer, and server.

export const SCHEMA_VERSION = 1;

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "password"
  | "select"
  | "radio"
  | "checkbox"
  | "multi-select"
  | "date"
  | "rating"
  | "file"
  | "hidden"
  | "otp"
  | "statement";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  maxFiles?: number;
  maxFileSizeMb?: number;
  accept?: string;
}

export interface FieldMeta {
  width?: "full" | "half";
}

export interface FieldDef {
  id: string; // immutable nanoid
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  validation?: FieldValidation;
  options?: FieldOption[];
  meta?: FieldMeta;
  /** for hidden fields: which query param / source to capture */
  hiddenSource?: string;
}

export interface Page {
  id: string;
  title?: string;
  fields: FieldDef[];
}

export type LogicOp =
  | "eq"
  | "neq"
  | "contains"
  | "gt"
  | "lt"
  | "is_empty"
  | "is_not_empty";

export interface LogicCondition {
  fieldId: string;
  op: LogicOp;
  value?: unknown;
}

export type LogicAction =
  | { type: "show"; fieldId: string }
  | { type: "hide"; fieldId: string }
  | { type: "jumpTo"; pageId: string }
  | { type: "setRequired"; fieldId: string; required: boolean };

export interface LogicRule {
  id: string;
  when: { all?: LogicCondition[]; any?: LogicCondition[] };
  then: LogicAction[];
}

export interface ThemeTokens {
  fontFamily?: string; // "inherit" picks up host page fonts
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  spacing?: string;
  buttonTextColor?: string;
}

export interface FormSettings {
  submitBehavior?: { type: "message"; message: string } | { type: "redirect"; url: string };
  notifications?: { ownerEmail?: string; autoResponder?: boolean };
  spam?: {
    honeypot?: boolean;
    minSecondsToSubmit?: number;
    flagThreshold?: number; // default 0.5
    rejectThreshold?: number; // default 1.0
  };
  limits?: { maxResponses?: number; openAt?: string; closeAt?: string };
  partials?: { enabled?: boolean };
  dedupeByEmail?: boolean;
  allowedOrigins?: string[];
}

export interface FormSchemaV1 {
  schemaVersion: number;
  title: string;
  pages: Page[];
  logic: LogicRule[];
  theme: ThemeTokens;
  settings: FormSettings;
}

export type AnswerValue = string | number | boolean | string[] | null;
export type Answers = Record<string, AnswerValue>;

export type SubmissionStatus = "complete" | "flagged" | "rejected";
export type EmbedSource = "framer" | "hosted" | "iframe" | "react" | "html";

export const FORM_EVENT_TYPES = [
  "form_view",
  "form_start",
  "field_focus",
  "field_blur",
  "field_error",
  "field_change",
  "page_next",
  "page_back",
  "form_abandon",
  "submit_attempt",
  "submit_success",
  "submit_error",
] as const;
export type FormEventType = (typeof FORM_EVENT_TYPES)[number];

export interface FormEventInput {
  formId: string;
  eventType: FormEventType;
  fieldId?: string;
  pageId?: string;
  sessionId: string;
  durationMs?: number;
  embedSource?: EmbedSource;
  meta?: Record<string, unknown>;
}
