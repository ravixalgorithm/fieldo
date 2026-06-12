"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { contactTemplate, FormsTable, type FormRow } from "@/components/forms-table";

const RECENT_LIMIT = 5;

export default function HomePage() {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [aiError, setAiError] = useState("");
  const router = useRouter();

  useEffect(() => {
    void fetch("/api/forms")
      .then((r) => r.json())
      .then((d) => {
        setForms(d.forms ?? []);
        setLoaded(true);
      });
  }, []);

  const create = async (useTemplate: boolean) => {
    setCreating(true);
    const body: Record<string, unknown> = { title: useTemplate ? "Contact form" : "Untitled form" };
    if (useTemplate) body.schema = contactTemplate("Contact form");
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setCreating(false);
    if (d.form) router.push(`/forms/${d.form.id}`);
  };

  const generate = async () => {
    if (!description.trim()) return;
    setCreating(true);
    setAiError("");
    const gen = await fetch("/api/ai/generate-form", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const g = await gen.json();
    if (!gen.ok) {
      setAiError(g.error ?? "Generation failed");
      setCreating(false);
      return;
    }
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: g.schema.title, schema: g.schema }),
    });
    const d = await res.json();
    setCreating(false);
    if (d.form) router.push(`/forms/${d.form.id}`);
    else setAiError(d.error ?? "Create failed");
  };

  const recent = forms.slice(0, RECENT_LIMIT);

  return (
    <div>
      <div className="page-head">
        <h2>Dashboard</h2>
        <div className="row">
          <button className="btn secondary" disabled={creating} onClick={() => create(true)}>
            Contact template
          </button>
          <button className="btn" disabled={creating} onClick={() => create(false)}>
            + New form
          </button>
        </div>
      </div>

      <div className="card create-panel">
        <h3 style={{ marginTop: 0, marginBottom: 4 }}>Start with AI</h3>
        <p className="muted" style={{ marginTop: 0, marginBottom: 14 }}>
          Describe the form and AI drafts the fields, pages, and logic for you.
        </p>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input
            className="text"
            placeholder="A contact form asking name, work email, company size"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <button className="btn accent" style={{ flex: "none" }} disabled={creating || !description.trim()} onClick={generate}>
            {creating ? "Generating…" : "Generate"}
          </button>
        </div>
        {aiError && <p className="error-text" style={{ marginTop: 8 }}>{aiError}</p>}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>Recent forms</h3>
          {forms.length > RECENT_LIMIT && (
            <Link href="/forms" className="muted" style={{ fontWeight: 600 }}>
              View all {forms.length} forms →
            </Link>
          )}
        </div>
        {!loaded ? (
          <p className="empty-state">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="empty-state">No forms yet — create your first one above.</p>
        ) : (
          <FormsTable forms={recent} />
        )}
      </div>
    </div>
  );
}
