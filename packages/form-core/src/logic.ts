import type { Answers, FormSchemaV1, LogicCondition, LogicRule } from "@fieldo/types";

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

function evalCondition(c: LogicCondition, answers: Answers): boolean {
  const v = answers[c.fieldId];
  switch (c.op) {
    case "eq":
      return String(v ?? "") === String(c.value ?? "");
    case "neq":
      return String(v ?? "") !== String(c.value ?? "");
    case "contains":
      if (Array.isArray(v)) return v.map(String).includes(String(c.value));
      return String(v ?? "").includes(String(c.value ?? ""));
    case "gt":
      return Number(v) > Number(c.value);
    case "lt":
      return Number(v) < Number(c.value);
    case "is_empty":
      return isEmpty(v);
    case "is_not_empty":
      return !isEmpty(v);
  }
}

export interface LogicResult {
  /** field ids visible after applying rules (all fields visible by default) */
  visibleFieldIds: Set<string>;
  /** required overrides from setRequired actions */
  requiredOverrides: Map<string, boolean>;
  /** jump target page id, if a matched rule requested one */
  jumpToPageId?: string;
}

/**
 * Pure logic evaluation — runs identically client-side (UX) and
 * server-side (security: hidden fields cannot be injected).
 */
export function evaluateLogic(schema: FormSchemaV1, answers: Answers): LogicResult {
  const allIds = schema.pages.flatMap((p) => p.fields.map((f) => f.id));
  const visible = new Set(allIds);
  const requiredOverrides = new Map<string, boolean>();
  let jumpToPageId: string | undefined;

  for (const rule of schema.logic ?? []) {
    const matched = ruleMatches(rule, answers);
    for (const action of rule.then) {
      if (action.type === "show") {
        if (matched) visible.add(action.fieldId);
        else visible.delete(action.fieldId); // show-only-when rule
      } else if (action.type === "hide") {
        if (matched) visible.delete(action.fieldId);
      } else if (action.type === "setRequired" && matched) {
        requiredOverrides.set(action.fieldId, action.required);
      } else if (action.type === "jumpTo" && matched) {
        jumpToPageId = action.pageId;
      }
    }
  }
  return { visibleFieldIds: visible, requiredOverrides, jumpToPageId };
}

function ruleMatches(rule: LogicRule, answers: Answers): boolean {
  const all = rule.when.all ?? [];
  const any = rule.when.any ?? [];
  if (all.length && !all.every((c) => evalCondition(c, answers))) return false;
  if (any.length && !any.some((c) => evalCondition(c, answers))) return false;
  return all.length > 0 || any.length > 0;
}

/** Detect cycles: a rule whose action toggles a field that feeds its own condition. Cheap lint for the builder. */
export function lintLogic(schema: FormSchemaV1): string[] {
  const warnings: string[] = [];
  for (const rule of schema.logic ?? []) {
    const condFields = [...(rule.when.all ?? []), ...(rule.when.any ?? [])].map((c) => c.fieldId);
    for (const action of rule.then) {
      if ("fieldId" in action && condFields.includes(action.fieldId)) {
        warnings.push(`Rule ${rule.id}: action targets field ${action.fieldId} used in its own condition`);
      }
    }
  }
  return warnings;
}
