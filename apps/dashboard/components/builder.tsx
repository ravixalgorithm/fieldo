"use client";

/**
 * Visual form builder — palette, drag-reorderable field list, property panel,
 * pages, theme + settings editors. Mutates a FormSchemaV1 held by the parent;
 * the JSON tab and live preview stay in sync because the schema object is the
 * single source of truth.
 */
import { useState } from "react";
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

export function Builder({
  schema,
  onChange,
}: {
  schema: FormSchemaV1;
  onChange: (next: FormSchemaV1) => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const page: Page = schema.pages[Math.min(pageIndex, schema.pages.length - 1)];
  const selected = page.fields.find((f) => f.id === selectedId) ?? null;

  const update = (mutate: (draft: FormSchemaV1) => void) => {
    const draft = structuredClone(schema);
    mutate(draft);
    onChange(draft);
  };

  const addField = (type: FieldType) => {
    const id = newId("fld");
    update((d) => {
      const def = FIELD_TYPES.find((t) => t.type === type)!;
      const field: FieldDef = { id, type, label: def.label };
      if (OPTION_TYPES.includes(type)) {
        field.options = [
          { label: "Option 1", value: "option_1" },
          { label: "Option 2", value: "option_2" },
        ];
      }
      d.pages[pageIndex].fields.push(field);
    });
    setSelectedId(id);
  };

  const patchField = (id: string, patch: Partial<FieldDef>) =>
    update((d) => {
      const f = d.pages[pageIndex].fields.find((x) => x.id === id);
      if (f) Object.assign(f, patch);
    });

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
    if (selectedId === id) setSelectedId(null);
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
    setSelectedId(null);
  };

  const removePage = (i: number) => {
    if (schema.pages.length <= 1) return;
    update((d) => d.pages.splice(i, 1));
    setPageIndex(Math.max(0, i - 1));
    setSelectedId(null);
  };

  return (
    <div className="builder">
      {/* palette */}
      <div className="card builder-palette">
        <strong>Add field</strong>
        <div className="palette-grid">
          {FIELD_TYPES.map((t) => (
            <button key={t.type} className="palette-item" onClick={() => addField(t.type)} title={t.label}>
              <span className="palette-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* field list */}
      <div className="card builder-canvas">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <strong>Fields</strong>
          <div className="page-tabs">
            {schema.pages.map((p, i) => (
              <button
                key={p.id}
                className={i === pageIndex ? "current" : ""}
                onClick={() => {
                  setPageIndex(i);
                  setSelectedId(null);
                }}
              >
                Page {i + 1}
              </button>
            ))}
            <button onClick={addPage} title="Add page">+</button>
            {schema.pages.length > 1 && (
              <button onClick={() => removePage(pageIndex)} title="Delete this page">✕</button>
            )}
          </div>
        </div>
        {page.fields.length === 0 && <p className="empty-state">No fields yet — add one from the palette.</p>}
        <ul className="field-list">
          {page.fields.map((f) => (
            <li
              key={f.id}
              draggable
              onDragStart={() => setDragId(f.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(f.id)}
              onClick={() => setSelectedId(f.id)}
              className={`field-item ${selectedId === f.id ? "selected" : ""} ${dragId === f.id ? "dragging" : ""}`}
            >
              <span className="drag-handle" title="Drag to reorder">⠿</span>
              <span className="field-type">{FIELD_TYPES.find((t) => t.type === f.type)?.label ?? f.type}</span>
              <span className="field-label">
                {f.label}
                {f.required && <span className="req">*</span>}
              </span>
              <button
                className="field-delete"
                title="Delete field"
                onClick={(e) => {
                  e.stopPropagation();
                  removeField(f.id);
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* property panel */}
      <div className="card builder-props">
        <strong>Field settings</strong>
        {!selected ? (
          <p className="empty-state">Select a field in the list to edit its label, options, and validation.</p>
        ) : (
          <div className="props-form" key={selected.id}>
            <label>
              Label
              <input value={selected.label} onChange={(e) => patchField(selected.id, { label: e.target.value })} />
            </label>
            {selected.type !== "statement" && selected.type !== "hidden" && (
              <>
                <label>
                  Placeholder
                  <input
                    value={selected.placeholder ?? ""}
                    onChange={(e) => patchField(selected.id, { placeholder: e.target.value || undefined })}
                  />
                </label>
                <label>
                  Help text
                  <input
                    value={selected.helpText ?? ""}
                    onChange={(e) => patchField(selected.id, { helpText: e.target.value || undefined })}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!selected.required}
                    onChange={(e) => patchField(selected.id, { required: e.target.checked || undefined })}
                  />
                  Required
                </label>
              </>
            )}
            {OPTION_TYPES.includes(selected.type) && (
              <label>
                Options (one per line)
                <textarea
                  rows={5}
                  value={(selected.options ?? []).map((o) => o.label).join("\n")}
                  onChange={(e) =>
                    patchField(selected.id, {
                      options: e.target.value
                        .split("\n")
                        .filter((l) => l.trim())
                        .map((l) => ({
                          label: l.trim(),
                          value: l.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
                        })),
                    })
                  }
                />
              </label>
            )}
            {selected.type === "hidden" && (
              <label>
                Source query param
                <input
                  value={selected.hiddenSource ?? ""}
                  placeholder="utm_source"
                  onChange={(e) => patchField(selected.id, { hiddenSource: e.target.value || undefined })}
                />
              </label>
            )}
            <p className="muted" style={{ fontSize: 12 }}>id: {selected.id}</p>
          </div>
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
