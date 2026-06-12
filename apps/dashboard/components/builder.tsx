"use client";

/**
 * Visual form builder — fields list with inline expand-down editor per field.
 */
import { useEffect, useRef, useState } from "react";
import type { FieldDef, FieldType, FormSchemaV1, Page } from "@fieldo/types";

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: "text", label: "Text", icon: "Aa" },
  { type: "textarea", label: "Long text", icon: "¶" },
  { type: "email", label: "Email", icon: "@" },
  { type: "phone", label: "Phone", icon: "☎" },
  { type: "url", label: "URL", icon: "🔗" },
  { type: "number", label: "Number", icon: "#" },
  { type: "select", label: "Dropdown", icon: "▾" },
  { type: "radio", label: "Radio", icon: "◉" },
  { type: "checkbox", label: "Checkbox", icon: "☑" },
  { type: "multi-select", label: "Multi-select", icon: "≣" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "rating", label: "Rating", icon: "★" },
  { type: "file", label: "File upload", icon: "📎" },
  { type: "statement", label: "Statement", icon: "ℹ" },
  { type: "hidden", label: "Hidden", icon: "ø" },
];

const OPTION_TYPES: FieldType[] = ["select", "radio", "multi-select"];

let seq = 0;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

const fieldTypeMeta = (type: FieldType) => FIELD_TYPES.find((t) => t.type === type);

function defaultOptions() {
  return [
    { label: "Option 1", value: "option_1" },
    { label: "Option 2", value: "option_2" },
  ];
}

function applyFieldType(base: FieldDef, type: FieldType): FieldDef {
  const meta = fieldTypeMeta(type)!;
  const next: FieldDef = {
    id: base.id,
    type,
    label: base.label === fieldTypeMeta(base.type)?.label ? meta.label : base.label,
  };
  if (OPTION_TYPES.includes(type)) {
    next.options = base.options?.length ? base.options : defaultOptions();
  }
  if (type === "hidden" && base.hiddenSource) next.hiddenSource = base.hiddenSource;
  if (base.placeholder && type !== "statement" && type !== "hidden") next.placeholder = base.placeholder;
  if (base.helpText && type !== "statement" && type !== "hidden") next.helpText = base.helpText;
  if (base.required && type !== "statement" && type !== "hidden") next.required = true;
  return next;
}

function FieldTypeDropdown({
  value,
  onChange,
}: {
  value: FieldType;
  onChange: (type: FieldType) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = fieldTypeMeta(value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="field-type-select" ref={rootRef}>
      <span className="field-type-select-label">Field type</span>
      <button
        type="button"
        className={`field-type-select-trigger ${open ? "open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="field-type-select-icon">{selected?.icon ?? "?"}</span>
        <span className="field-type-select-value">{selected?.label ?? value}</span>
        <span className="field-type-select-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <ul className="field-type-select-menu" role="listbox" aria-label="Field type">
          {FIELD_TYPES.map((t) => (
            <li key={t.type} role="none">
              <button
                type="button"
                role="option"
                aria-selected={t.type === value}
                className={`field-type-select-option ${t.type === value ? "selected" : ""}`}
                onClick={() => {
                  onChange(t.type);
                  setOpen(false);
                }}
              >
                <span className="field-type-select-option-icon">{t.icon}</span>
                <span className="field-type-select-option-label">{t.label}</span>
                {t.type === value ? <span className="field-type-select-check">✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FieldEditorPanel({
  field,
  onChange,
  onDelete,
}: {
  field: FieldDef;
  onChange: (next: FieldDef) => void;
  onDelete: () => void;
}) {
  const setType = (type: FieldType) => onChange(applyFieldType(field, type));

  return (
    <div className="field-editor-panel" onClick={(e) => e.stopPropagation()}>
      <div className="props-form">
        <FieldTypeDropdown value={field.type} onChange={setType} />
        <label>
          Label
          <input value={field.label} onChange={(e) => onChange({ ...field, label: e.target.value })} />
        </label>
        {field.type !== "statement" && field.type !== "hidden" && (
          <>
            <label>
              Placeholder
              <input
                value={field.placeholder ?? ""}
                onChange={(e) => onChange({ ...field, placeholder: e.target.value || undefined })}
              />
            </label>
            <label>
              Help text
              <input
                value={field.helpText ?? ""}
                onChange={(e) => onChange({ ...field, helpText: e.target.value || undefined })}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!field.required}
                onChange={(e) => onChange({ ...field, required: e.target.checked || undefined })}
              />
              Required
            </label>
          </>
        )}
        {OPTION_TYPES.includes(field.type) && (
          <label>
            Options (one per line)
            <textarea
              rows={4}
              value={(field.options ?? []).map((o) => o.label).join("\n")}
              onChange={(e) =>
                onChange({
                  ...field,
                  options: e.target.value
                    .split("\n")
                    .filter((l) => l.trim())
                    .map((l) => ({
                      label: l.trim(),
                      value: l
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "_")
                        .replace(/^_+|_+$/g, ""),
                    })),
                })
              }
            />
          </label>
        )}
        {field.type === "hidden" && (
          <label>
            Source query param
            <input
              value={field.hiddenSource ?? ""}
              placeholder="utm_source"
              onChange={(e) => onChange({ ...field, hiddenSource: e.target.value || undefined })}
            />
          </label>
        )}
      </div>
      <button type="button" className="btn danger small" onClick={onDelete}>
        Delete field
      </button>
    </div>
  );
}

export function Builder({
  schema,
  onChange,
}: {
  schema: FormSchemaV1;
  onChange: (next: FormSchemaV1) => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const page: Page = schema.pages[Math.min(pageIndex, schema.pages.length - 1)];

  const update = (mutate: (draft: FormSchemaV1) => void) => {
    const draft = structuredClone(schema);
    mutate(draft);
    onChange(draft);
  };

  const replaceField = (id: string, field: FieldDef) =>
    update((d) => {
      const i = d.pages[pageIndex].fields.findIndex((x) => x.id === id);
      if (i >= 0) d.pages[pageIndex].fields[i] = field;
    });

  const addField = () => {
    const id = newId("fld");
    update((d) => d.pages[pageIndex].fields.push({ id, type: "text", label: "Text" }));
    setExpandedId(id);
  };

  const toggleField = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const removeField = (id: string) => {
    update((d) => {
      const fields = d.pages[pageIndex].fields;
      const i = fields.findIndex((x) => x.id === id);
      if (i >= 0) fields.splice(i, 1);
      d.logic = d.logic.filter(
        (r) =>
          !(r.when.all ?? []).concat(r.when.any ?? []).some((c) => c.fieldId === id) &&
          !r.then.some((a) => "fieldId" in a && a.fieldId === id)
      );
    });
    if (expandedId === id) setExpandedId(null);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    update((d) => {
      const fields = d.pages[pageIndex].fields;
      const from = fields.findIndex((f) => f.id === dragId);
      const to = fields.findIndex((f) => f.id === targetId);
      if (from < 0 || to < 0) return;
      const [moved] = fields.splice(from, 1);
      fields.splice(to, 0, moved);
    });
    setDragId(null);
  };

  const addPage = () => {
    update((d) => d.pages.push({ id: newId("page"), fields: [] }));
    setPageIndex(schema.pages.length);
    setExpandedId(null);
  };

  const removePage = (i: number) => {
    if (schema.pages.length <= 1) return;
    update((d) => d.pages.splice(i, 1));
    setPageIndex(Math.max(0, i - 1));
    setExpandedId(null);
  };

  return (
    <div className="builder">
      <div className="card builder-fields">
        <div className="builder-fields-head">
          <strong>Fields</strong>
          <div className="builder-fields-actions">
            <div className="page-tabs">
              {schema.pages.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={i === pageIndex ? "current" : ""}
                  onClick={() => {
                    setPageIndex(i);
                    setExpandedId(null);
                  }}
                >
                  Page {i + 1}
                </button>
              ))}
              <button type="button" onClick={addPage} title="Add page">
                +
              </button>
              {schema.pages.length > 1 && (
                <button type="button" onClick={() => removePage(pageIndex)} title="Delete this page">
                  ✕
                </button>
              )}
            </div>
            <button type="button" className="btn small" onClick={addField}>
              + Add field
            </button>
          </div>
        </div>

        {page.fields.length === 0 ? (
          <div className="builder-fields-empty">
            <p className="empty-state">No fields on this page yet.</p>
            <button type="button" className="btn secondary" onClick={addField}>
              Add your first field
            </button>
          </div>
        ) : (
          <ul className="field-list">
            {page.fields.map((f) => {
              const meta = fieldTypeMeta(f.type);
              const expanded = expandedId === f.id;
              return (
                <li key={f.id} className={`field-block ${expanded ? "expanded" : ""}`}>
                  <div
                    draggable
                    onDragStart={() => setDragId(f.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dropOn(f.id)}
                    onClick={() => toggleField(f.id)}
                    className={`field-item ${expanded ? "selected" : ""} ${dragId === f.id ? "dragging" : ""}`}
                  >
                    <span className="drag-handle" title="Drag to reorder" onClick={(e) => e.stopPropagation()}>
                      ⠿
                    </span>
                    <span className="field-type-icon">{meta?.icon ?? "?"}</span>
                    <div className="field-item-main">
                      <span className="field-item-label">
                        {f.label}
                        {f.required && <span className="req">*</span>}
                      </span>
                      <span className="field-item-type">{meta?.label ?? f.type}</span>
                    </div>
                    <span className="field-chevron" aria-hidden>
                      {expanded ? "▾" : "▸"}
                    </span>
                    <button
                      type="button"
                      className="field-delete"
                      title="Delete field"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(f.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  {expanded && (
                    <FieldEditorPanel
                      field={f}
                      onChange={(next) => replaceField(f.id, next)}
                      onDelete={() => removeField(f.id)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ThemeEditor({
  schema,
  onChange,
}: {
  schema: FormSchemaV1;
  onChange: (next: FormSchemaV1) => void;
}) {
  const theme = schema.theme;
  const set = (key: string, value: string) =>
    onChange({ ...schema, theme: { ...theme, [key]: value || undefined } });
  const color = (key: keyof typeof theme, label: string, fallback: string) => (
    <label className="theme-row" key={key}>
      <span>{label}</span>
      <input type="color" value={(theme[key] as string) ?? fallback} onChange={(e) => set(key, e.target.value)} />
      <input value={(theme[key] as string) ?? ""} placeholder={fallback} onChange={(e) => set(key, e.target.value)} />
    </label>
  );
  return (
    <div className="props-form" style={{ maxWidth: 420 }}>
      {color("primaryColor", "Primary", "#0f766e")}
      {color("backgroundColor", "Background", "#ffffff")}
      {color("textColor", "Text", "#111827")}
      {color("borderColor", "Border", "#d1d5db")}
      {color("buttonTextColor", "Button text", "#ffffff")}
      <label className="theme-row">
        <span>Font family</span>
        <input
          value={theme.fontFamily ?? ""}
          placeholder="inherit (host page font)"
          onChange={(e) => set("fontFamily", e.target.value)}
          style={{ gridColumn: "2 / 4" }}
        />
      </label>
      <label className="theme-row">
        <span>Border radius</span>
        <input value={theme.borderRadius ?? ""} placeholder="8px" onChange={(e) => set("borderRadius", e.target.value)} style={{ gridColumn: "2 / 4" }} />
      </label>
      <label className="theme-row">
        <span>Spacing</span>
        <input value={theme.spacing ?? ""} placeholder="16px" onChange={(e) => set("spacing", e.target.value)} style={{ gridColumn: "2 / 4" }} />
      </label>
    </div>
  );
}

export function SettingsEditor({
  schema,
  onChange,
}: {
  schema: FormSchemaV1;
  onChange: (next: FormSchemaV1) => void;
}) {
  const s = schema.settings;
  const set = (patch: Partial<typeof s>) => onChange({ ...schema, settings: { ...s, ...patch } });
  const behavior = s.submitBehavior;
  return (
    <div className="props-form" style={{ maxWidth: 480 }}>
      <strong>After submit</strong>
      <label>
        Behavior
        <select
          value={behavior?.type ?? "message"}
          onChange={(e) =>
            set({
              submitBehavior:
                e.target.value === "redirect"
                  ? { type: "redirect", url: behavior?.type === "redirect" ? behavior.url : "" }
                  : { type: "message", message: behavior?.type === "message" ? behavior.message : "Thanks — your response has been recorded." },
            })
          }
        >
          <option value="message">Show a message</option>
          <option value="redirect">Redirect to URL</option>
        </select>
      </label>
      {(!behavior || behavior.type === "message") && (
        <label>
          Message
          <input
            value={behavior?.type === "message" ? behavior.message : "Thanks — your response has been recorded."}
            onChange={(e) => set({ submitBehavior: { type: "message", message: e.target.value } })}
          />
        </label>
      )}
      {behavior?.type === "redirect" && (
        <label>
          Redirect URL
          <input value={behavior.url} placeholder="https://…" onChange={(e) => set({ submitBehavior: { type: "redirect", url: e.target.value } })} />
        </label>
      )}

      <strong style={{ marginTop: 12 }}>Spam & limits</strong>
      <label className="checkbox-label">
        <input type="checkbox" checked={!!s.dedupeByEmail} onChange={(e) => set({ dedupeByEmail: e.target.checked || undefined })} />
        One response per email address
      </label>
      <label>
        Minimum seconds before submit (time-trap)
        <input
          type="number"
          min={0}
          value={s.spam?.minSecondsToSubmit ?? 3}
          onChange={(e) => set({ spam: { ...s.spam, minSecondsToSubmit: Number(e.target.value) } })}
        />
      </label>
      <label>
        Max responses (blank = unlimited)
        <input
          type="number"
          min={1}
          value={s.limits?.maxResponses ?? ""}
          onChange={(e) =>
            set({ limits: { ...s.limits, maxResponses: e.target.value ? Number(e.target.value) : undefined } })
          }
        />
      </label>
      <label>
        Allowed origins (comma-separated, blank = any)
        <input
          value={(s.allowedOrigins ?? []).join(", ")}
          placeholder="https://mysite.com"
          onChange={(e) =>
            set({
              allowedOrigins: e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
    </div>
  );
}
