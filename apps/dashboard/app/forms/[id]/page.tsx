"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FormRenderer } from "@fieldo/renderer";
import type { FormSchemaV1 } from "@fieldo/types";

interface FormRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  draftSchema: FormSchemaV1;
  publishedVersionId: string | null;
  submissionCount: number;
}

export default function FormEditorPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<FormRow | null>(null);
  const [json, setJson] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState<"editor" | "share">("editor");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    void fetch(`/api/forms/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.form) {
          setForm(d.form);
          setJson(JSON.stringify(d.form.draftSchema, null, 2));
        }
      });
  }, [params.id]);

  const parsed = useMemo<FormSchemaV1 | null>(() => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [json]);

  const save = async () => {
    if (!parsed) {
      setErrorMsg("Invalid JSON");
      setSaveState("error");
      return;
    }
    setSaveState("saving");
    const res = await fetch(`/api/forms/${params.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ schema: parsed }),
    });
    const d = await res.json();
    if (!res.ok) {
      setErrorMsg(d.error ?? "Save failed");
      setSaveState("error");
    } else {
      setForm(d.form);
      setErrorMsg("");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    }
  };

  const publish = async () => {
    await save();
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

  if (!form) return <p className="muted">Loading…</p>;

  const hostedUrl = `${origin}/f/${form.slug}`;

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
        </div>
      </div>

      <div className="tabs">
        <button className={tab === "editor" ? "active" : ""} onClick={() => setTab("editor")}>Editor</button>
        <button className={tab === "share" ? "active" : ""} onClick={() => setTab("share")}>Share & embed</button>
      </div>

      {tab === "editor" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <strong>Schema (FormSchemaV1)</strong>
              <div className="row">
                <button className="btn secondary small" onClick={save} disabled={saveState === "saving"}>
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save draft"}
                </button>
                <button className="btn small" onClick={publish}>Publish</button>
              </div>
            </div>
            {errorMsg && <div className="error-text" style={{ marginBottom: 8 }}>{errorMsg}</div>}
            <textarea className="code" value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} />
          </div>
          <div className="card">
            <strong>Live preview</strong>
            <div style={{ marginTop: 14 }}>
              {parsed?.pages ? (
                <FormRenderer key={json} schema={parsed} formId={form.id} mode="preview" />
              ) : (
                <p className="error-text">Fix the JSON to see the preview.</p>
              )}
            </div>
          </div>
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
