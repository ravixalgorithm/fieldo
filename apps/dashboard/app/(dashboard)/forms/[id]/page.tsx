"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FormRenderer } from "@fieldo/renderer";
import type { FormSchemaV1 } from "@fieldo/types";
import { Builder, ThemeEditor, SettingsEditor } from "@/components/builder";

interface FormRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  draftSchema: FormSchemaV1;
  publishedVersionId: string | null;
  submissionCount: number;
}

type Tab = "build" | "json" | "theme" | "settings" | "share";

export default function FormEditorPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<FormRow | null>(null);
  const [schema, setSchema] = useState<FormSchemaV1 | null>(null);
  const [json, setJson] = useState("");
  const [jsonDirty, setJsonDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState<Tab>("build");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    void fetch(`/api/forms/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.form) {
          setForm(d.form);
          setSchema(d.form.draftSchema);
          setJson(JSON.stringify(d.form.draftSchema, null, 2));
        }
      });
  }, [params.id]);

  // schema object is the source of truth; JSON text follows it unless the user
  // is mid-edit in the JSON tab
  const applySchema = (next: FormSchemaV1) => {
    setSchema(next);
    setJson(JSON.stringify(next, null, 2));
    setJsonDirty(false);
  };

  const applyJson = (text: string) => {
    setJson(text);
    setJsonDirty(true);
    try {
      setSchema(JSON.parse(text));
      setErrorMsg("");
    } catch {
      /* keep last valid schema for preview; save will complain */
    }
  };

  const parsedJsonValid = useMemo(() => {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }, [json]);

  const save = async (): Promise<boolean> => {
    if (jsonDirty && !parsedJsonValid) {
      setErrorMsg("Invalid JSON");
      setSaveState("error");
      return false;
    }
    if (!schema) return false;
    setSaveState("saving");
    const res = await fetch(`/api/forms/${params.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ schema }),
    });
    const d = await res.json();
    if (!res.ok) {
      setErrorMsg(d.error ?? "Save failed");
      setSaveState("error");
      return false;
    }
    setForm(d.form);
    applySchema(d.form.draftSchema);
    setErrorMsg("");
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1500);
    return true;
  };

  const publish = async () => {
    if (!(await save())) return;
    const res = await fetch(`/api/forms/${params.id}/publish`, { method: "POST" });
    const d = await res.json();
    if (!res.ok) {
      setErrorMsg(d.error ?? "Publish failed");
      setSaveState("error");
    } else {
      setForm(d.form);
      setErrorMsg("");
    }
  };

  if (!form || !schema) return <p className="muted">Loading…</p>;

  const hostedUrl = `${origin}/f/${form.slug}`;
  const preview = (
    <div className="card">
      <strong>Live preview</strong>
      <div style={{ marginTop: 14 }}>
        {schema.pages ? (
          <FormRenderer key={JSON.stringify(schema)} schema={schema} formId={form.id} mode="preview" />
        ) : (
          <p className="error-text">Schema has no pages.</p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="row">
          <h2 style={{ margin: 0 }}>{form.title}</h2>
          <span className={`badge ${form.status}`}>{form.status}</span>
        </div>
        <div className="row">
          <Link className="btn secondary small" href={`/forms/${form.id}/inbox`}>Inbox ({form.submissionCount})</Link>
          <Link className="btn secondary small" href={`/forms/${form.id}/analytics`}>Analytics</Link>
          {form.status === "published" && <a className="btn secondary small" href={hostedUrl} target="_blank">View live ↗</a>}
          <button className="btn secondary small" onClick={save} disabled={saveState === "saving"}>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save draft"}
          </button>
          <button className="btn small" onClick={publish}>Publish</button>
        </div>
      </div>

      {errorMsg && <div className="error-text" style={{ marginBottom: 8 }}>{errorMsg}</div>}

      <div className="tabs">
        {(["build", "json", "theme", "settings", "share"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "build" ? "Build" : t === "json" ? "JSON" : t === "theme" ? "Theme" : t === "settings" ? "Settings" : "Share & embed"}
          </button>
        ))}
      </div>

      {tab === "build" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px,340px)", gap: 16, alignItems: "start" }}>
          <Builder schema={schema} onChange={applySchema} />
          {preview}
        </div>
      )}

      {tab === "json" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card">
            <strong>Schema (FormSchemaV1)</strong>
            <textarea className="code" value={json} onChange={(e) => applyJson(e.target.value)} spellCheck={false} style={{ marginTop: 10 }} />
          </div>
          {preview}
        </div>
      )}

      {tab === "theme" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card">
            <strong>Theme</strong>
            <div style={{ marginTop: 10 }}>
              <ThemeEditor schema={schema} onChange={applySchema} />
            </div>
          </div>
          {preview}
        </div>
      )}

      {tab === "settings" && (
        <div className="card">
          <SettingsEditor schema={schema} onChange={applySchema} />
        </div>
      )}

      {tab === "share" && (
        <div className="card">
          {form.status !== "published" ? (
            <p className="muted">Publish the form first to get share links and embed codes.</p>
          ) : (
            <>
              <h3>Hosted link</h3>
              <pre className="embed">{hostedUrl}</pre>
              <h3>HTML script (no iframe)</h3>
              <pre className="embed">{`<script src="${origin}/embed.js" data-form="${form.id}"></script>`}</pre>
              <h3>iFrame embed</h3>
              <pre className="embed">{`<iframe src="${hostedUrl}?embed=1" style="width:100%;border:0;min-height:480px"></iframe>`}</pre>
              <h3>Framer component</h3>
              <pre className="embed">{`formId = "${form.id}"\napiBaseUrl = "${origin}"`}</pre>
              <h3>React</h3>
              <pre className="embed">{`import { FieldoForm } from "@fieldo/react";\n\n<FieldoForm id="${form.id}" apiBaseUrl="${origin}" />`}</pre>
              <h3>API</h3>
              <pre className="embed">{`GET  ${origin}/api/v1/forms/${form.id}/meta\nPOST ${origin}/api/v1/forms/${form.id}/submit`}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
