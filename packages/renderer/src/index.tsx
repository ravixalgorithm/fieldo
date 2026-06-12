"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  Answers,
  AnswerValue,
  EmbedSource,
  FieldDef,
  FormEventType,
  FormSchemaV1,
  ThemeTokens,
} from "@fieldo/types";
import { evaluateLogic, validateSubmission, HONEYPOT_FIELD_NAME } from "@fieldo/form-core";

export interface FormRendererProps {
  schema: FormSchemaV1;
  formId: string;
  apiBaseUrl?: string;
  /** signed render token from the /meta endpoint (time-trap) */
  renderToken?: string;
  embedSource?: EmbedSource;
  mode?: "live" | "preview" | "canvas";
  theme?: ThemeTokens;
  onSubmitted?: (submissionId: string) => void;
}

function themeVars(theme: ThemeTokens): React.CSSProperties {
  return {
    "--fieldo-font": theme.fontFamily ?? "inherit",
    "--fieldo-primary": theme.primaryColor ?? "#0f766e",
    "--fieldo-bg": theme.backgroundColor ?? "transparent",
    "--fieldo-text": theme.textColor ?? "#111827",
    "--fieldo-border": theme.borderColor ?? "#d1d5db",
    "--fieldo-radius": theme.borderRadius ?? "8px",
    "--fieldo-spacing": theme.spacing ?? "16px",
    "--fieldo-button-text": theme.buttonTextColor ?? "#ffffff",
  } as React.CSSProperties;
}

const baseCss = `
.fieldo-form{font-family:var(--fieldo-font);color:var(--fieldo-text);background:var(--fieldo-bg);display:flex;flex-direction:column;gap:var(--fieldo-spacing);max-width:560px}
.fieldo-field{display:flex;flex-direction:column;gap:6px}
.fieldo-label{font-weight:600;font-size:14px}
.fieldo-required{color:#ef4444;margin-left:2px}
.fieldo-help{font-size:12px;opacity:.7}
.fieldo-error{font-size:12px;color:#ef4444}
.fieldo-input,.fieldo-select,.fieldo-textarea{border:1px solid var(--fieldo-border);border-radius:var(--fieldo-radius);padding:10px 12px;font:inherit;font-size:14px;background:#fff;color:inherit}
.fieldo-input:focus,.fieldo-select:focus,.fieldo-textarea:focus{outline:2px solid var(--fieldo-primary);outline-offset:1px;border-color:var(--fieldo-primary)}
.fieldo-textarea{min-height:96px;resize:vertical}
.fieldo-choice{display:flex;align-items:center;gap:8px;font-size:14px}
.fieldo-button{background:var(--fieldo-primary);color:var(--fieldo-button-text);border:0;border-radius:var(--fieldo-radius);padding:11px 20px;font:inherit;font-weight:600;font-size:14px;cursor:pointer}
.fieldo-button:disabled{opacity:.6;cursor:default}
.fieldo-button-secondary{background:transparent;color:var(--fieldo-text);border:1px solid var(--fieldo-border)}
.fieldo-nav{display:flex;gap:8px;justify-content:space-between;align-items:center}
.fieldo-progress{height:4px;background:var(--fieldo-border);border-radius:2px;overflow:hidden}
.fieldo-progress>div{height:100%;background:var(--fieldo-primary);transition:width .25s}
.fieldo-rating{display:flex;gap:4px}
.fieldo-star{font-size:24px;background:none;border:0;cursor:pointer;color:var(--fieldo-border);padding:0}
.fieldo-star.on{color:var(--fieldo-primary)}
.fieldo-statement{font-size:14px;opacity:.85}
.fieldo-success{padding:24px;border:1px solid var(--fieldo-border);border-radius:var(--fieldo-radius);text-align:center;font-size:15px}
.fieldo-hp{position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden}
`;

function newSessionId() {
  return "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function FormRenderer({
  schema,
  formId,
  apiBaseUrl = "",
  renderToken,
  embedSource = "hosted",
  mode = "live",
  theme,
  onSubmitted,
}: FormRendererProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const sessionId = useMemo(newSessionId, []);
  const startedRef = useRef(false);
  const focusTimes = useRef<Record<string, number>>({});
  const startTime = useRef<number>(Date.now());

  const live = mode === "live";
  const mergedTheme = { ...schema.theme, ...theme };
  const logic = useMemo(() => evaluateLogic(schema, answers), [schema, answers]);

  const sendEvent = (eventType: FormEventType, extra: Partial<{ fieldId: string; pageId: string; durationMs: number }> = {}) => {
    if (!live) return;
    const payload = JSON.stringify({
      events: [{ formId, eventType, sessionId, embedSource, ...extra }],
    });
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(`${apiBaseUrl}/api/v1/events`, new Blob([payload], { type: "application/json" }));
      } else {
        void fetch(`${apiBaseUrl}/api/v1/events`, { method: "POST", body: payload, keepalive: true });
      }
    } catch {
      /* analytics must never break the form */
    }
  };

  useEffect(() => {
    sendEvent("form_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // partial capture on tab hide
  useEffect(() => {
    if (!live || schema.settings.partials?.enabled === false) return;
    const onHide = () => {
      if (document.visibilityState === "hidden" && Object.keys(answers).length > 0 && !done) {
        sendPartial();
        sendEvent("form_abandon");
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, done]);

  const partialTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendPartial = (lastFieldId?: string) => {
    if (!live || schema.settings.partials?.enabled === false) return;
    const body = JSON.stringify({ sessionId, answers, lastFieldId });
    void fetch(`${apiBaseUrl}/api/v1/forms/${formId}/partials`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  };

  const setAnswer = (fieldId: string, value: AnswerValue) => {
    if (!startedRef.current) {
      startedRef.current = true;
      sendEvent("form_start");
    }
    setAnswers((a) => ({ ...a, [fieldId]: value }));
    setErrors((e) => {
      if (!e[fieldId]) return e;
      const { [fieldId]: _, ...rest } = e;
      return rest;
    });
  };

  const onFieldFocus = (fieldId: string) => {
    focusTimes.current[fieldId] = Date.now();
    sendEvent("field_focus", { fieldId });
  };
  const onFieldBlur = (fieldId: string) => {
    const t = focusTimes.current[fieldId];
    sendEvent("field_blur", { fieldId, durationMs: t ? Date.now() - t : undefined });
    // debounced partial beacon (the email-on-blur goldmine)
    if (partialTimer.current) clearTimeout(partialTimer.current);
    partialTimer.current = setTimeout(() => sendPartial(fieldId), 2000);
  };

  const pages = schema.pages;
  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const visibleFields = page.fields.filter((f) => logic.visibleFieldIds.has(f.id) && f.type !== "hidden");

  const validatePage = (): boolean => {
    const result = validateSubmission(schema, answers);
    const pageErrors: Record<string, string> = {};
    for (const f of page.fields) {
      if (result.errors[f.id]) pageErrors[f.id] = result.errors[f.id];
    }
    setErrors(pageErrors);
    for (const [fieldId] of Object.entries(pageErrors)) sendEvent("field_error", { fieldId });
    return Object.keys(pageErrors).length === 0;
  };

  const next = () => {
    if (!validatePage()) return;
    sendEvent("page_next", { pageId: page.id });
    const jump = logic.jumpToPageId;
    if (jump) {
      const i = pages.findIndex((p) => p.id === jump);
      if (i >= 0) return setPageIndex(i);
    }
    setPageIndex((i) => Math.min(i + 1, pages.length - 1));
  };

  const submit = async () => {
    if (!validatePage()) {
      sendEvent("submit_attempt");
      return;
    }
    sendEvent("submit_attempt");
    if (!live) {
      setDone("Preview: submission not sent.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/forms/${formId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answers,
          sessionId,
          renderToken,
          embedSource,
          timeToCompleteMs: Date.now() - startTime.current,
          [HONEYPOT_FIELD_NAME]: honeypotRef.current?.value ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422 && data.errors) {
          setErrors(data.errors);
          // jump back to first page containing an error
          const errIds = Object.keys(data.errors);
          const idx = pages.findIndex((p) => p.fields.some((f) => errIds.includes(f.id)));
          if (idx >= 0) setPageIndex(idx);
        } else {
          setSubmitError(data.error ?? "Something went wrong. Please try again.");
        }
        sendEvent("submit_error");
        return;
      }
      sendEvent("submit_success");
      const behavior = data.behavior;
      if (behavior?.type === "redirect" && typeof window !== "undefined") {
        window.location.href = behavior.url;
        return;
      }
      setDone(behavior?.message ?? "Thanks — your response has been recorded.");
      onSubmitted?.(data.submissionId);
    } catch {
      setSubmitError("Network error. Please try again.");
      sendEvent("submit_error");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="fieldo-form" style={themeVars(mergedTheme)}>
        <style dangerouslySetInnerHTML={{ __html: baseCss }} />
        <div className="fieldo-success">{done}</div>
      </div>
    );
  }

  const isLast = pageIndex === pages.length - 1;

  return (
    <form
      className="fieldo-form"
      style={themeVars(mergedTheme)}
      onSubmit={(e) => {
        e.preventDefault();
        isLast ? void submit() : next();
      }}
      noValidate
    >
      <style dangerouslySetInnerHTML={{ __html: baseCss }} />
      {pages.length > 1 && (
        <div className="fieldo-progress" aria-hidden>
          <div style={{ width: `${((pageIndex + 1) / pages.length) * 100}%` }} />
        </div>
      )}
      {page.title && <h3 style={{ margin: 0 }}>{page.title}</h3>}
      {visibleFields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={answers[field.id]}
          error={errors[field.id]}
          required={logic.requiredOverrides.get(field.id) ?? field.required ?? false}
          disabled={mode === "canvas"}
          onChange={(v) => setAnswer(field.id, v)}
          onFocus={() => onFieldFocus(field.id)}
          onBlur={() => onFieldBlur(field.id)}
        />
      ))}
      {/* honeypot */}
      <div className="fieldo-hp" aria-hidden>
        <label>
          Website
          <input ref={honeypotRef} type="text" name={HONEYPOT_FIELD_NAME} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {submitError && <div className="fieldo-error">{submitError}</div>}
      <div className="fieldo-nav">
        {pageIndex > 0 ? (
          <button
            type="button"
            className="fieldo-button fieldo-button-secondary"
            onClick={() => {
              sendEvent("page_back", { pageId: page.id });
              setPageIndex((i) => i - 1);
            }}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="fieldo-button" disabled={submitting || mode === "canvas"}>
          {isLast ? (submitting ? "Submitting…" : "Submit") : "Next"}
        </button>
      </div>
    </form>
  );
}

interface FieldInputProps {
  field: FieldDef;
  value: AnswerValue | undefined;
  error?: string;
  required: boolean;
  disabled?: boolean;
  onChange: (v: AnswerValue) => void;
  onFocus: () => void;
  onBlur: () => void;
}

function FieldInput({ field, value, error, required, disabled, onChange, onFocus, onBlur }: FieldInputProps) {
  const common = { onFocus, onBlur, disabled, "aria-invalid": !!error } as const;
  const id = `fieldo-${field.id}`;

  if (field.type === "statement") {
    return (
      <div className="fieldo-field">
        {field.label && <div className="fieldo-label">{field.label}</div>}
        {field.helpText && <div className="fieldo-statement">{field.helpText}</div>}
      </div>
    );
  }

  let control: React.ReactNode;
  switch (field.type) {
    case "textarea":
      control = (
        <textarea
          id={id}
          className="fieldo-textarea"
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          {...common}
        />
      );
      break;
    case "select":
      control = (
        <select id={id} className="fieldo-select" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} {...common}>
          <option value="">{field.placeholder ?? "Select…"}</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "radio":
      control = (
        <div role="radiogroup">
          {(field.options ?? []).map((o) => (
            <label key={o.value} className="fieldo-choice">
              <input
                type="radio"
                name={id}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                {...common}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
      break;
    case "checkbox":
      if (field.options?.length) {
        const arr = Array.isArray(value) ? value : [];
        control = (
          <div>
            {field.options.map((o) => (
              <label key={o.value} className="fieldo-choice">
                <input
                  type="checkbox"
                  checked={arr.includes(o.value)}
                  onChange={(e) =>
                    onChange(e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value))
                  }
                  {...common}
                />
                {o.label}
              </label>
            ))}
          </div>
        );
      } else {
        control = (
          <label className="fieldo-choice">
            <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} {...common} />
            {field.placeholder ?? "Yes"}
          </label>
        );
      }
      break;
    case "multi-select": {
      const arr = Array.isArray(value) ? value : [];
      control = (
        <div>
          {(field.options ?? []).map((o) => (
            <label key={o.value} className="fieldo-choice">
              <input
                type="checkbox"
                checked={arr.includes(o.value)}
                onChange={(e) => onChange(e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value))}
                {...common}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
      break;
    }
    case "rating": {
      const max = field.validation?.max ?? 5;
      const current = Number(value ?? 0);
      control = (
        <div className="fieldo-rating" role="radiogroup" aria-label={field.label}>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`fieldo-star ${n <= current ? "on" : ""}`}
              onClick={() => onChange(n)}
              onFocus={onFocus}
              onBlur={onBlur}
              disabled={disabled}
              aria-label={`${n} of ${max}`}
            >
              ★
            </button>
          ))}
        </div>
      );
      break;
    }
    case "date":
      control = (
        <input id={id} type="date" className="fieldo-input" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} {...common} />
      );
      break;
    case "file":
      control = (
        <input
          id={id}
          type="file"
          className="fieldo-input"
          accept={field.validation?.accept}
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
          {...common}
        />
      );
      break;
    case "otp":
      control = (
        <input
          id={id}
          inputMode="numeric"
          className="fieldo-input"
          placeholder={field.placeholder ?? "123456"}
          maxLength={6}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          {...common}
        />
      );
      break;
    default: {
      const typeMap: Record<string, string> = {
        email: "email",
        phone: "tel",
        url: "url",
        number: "number",
        password: "password",
      };
      control = (
        <input
          id={id}
          type={typeMap[field.type] ?? "text"}
          className="fieldo-input"
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
          {...common}
        />
      );
    }
  }

  return (
    <div className="fieldo-field">
      <label className="fieldo-label" htmlFor={id}>
        {field.label}
        {required && <span className="fieldo-required">*</span>}
      </label>
      {field.helpText && <div className="fieldo-help">{field.helpText}</div>}
      {control}
      {error && <div className="fieldo-error">{error}</div>}
    </div>
  );
}
