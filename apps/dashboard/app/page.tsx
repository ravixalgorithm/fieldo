"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FormRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  submissionCount: number;
  updatedAt: number;
}

export default function HomePage() {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void fetch("/api/forms").then((r) => r.json()).then((d) => setForms(d.forms ?? []));
  }, []);

  const create = async (useTemplate: boolean) => {
    setCreating(true);
    const body: Record<string, unknown> = { title: title || "Untitled form" };
    if (useTemplate) body.schema = contactTemplate(title || "Contact form");
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setCreating(false);
    if (d.form) router.push(`/forms/${d.form.id}`);
  };

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Create a form</h2>
        <div className="row">
          <input
            className="text"
            style={{ maxWidth: 360 }}
            placeholder="Form title (e.g. Contact form)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="btn" disabled={creating} onClick={() => create(true)}>
            New from contact template
          </button>
          <button className="btn secondary" disabled={creating} onClick={() => create(false)}>
            New blank form
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Your forms</h2>
        {forms.length === 0 ? (
          <p className="muted">No forms yet — create one above.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Title</th><th>Status</th><th>Submissions</th><th>Link</th></tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr key={f.id}>
                  <td><Link href={`/forms/${f.id}`}><strong>{f.title}</strong></Link></td>
                  <td><span className={`badge ${f.status}`}>{f.status}</span></td>
                  <td><Link href={`/forms/${f.id}/inbox`}>{f.submissionCount} →</Link></td>
                  <td>{f.status === "published" ? <a href={`/f/${f.slug}`} target="_blank">/f/{f.slug}</a> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function contactTemplate(title: string) {
  return {
    schemaVersion: 1,
    title,
    pages: [
      {
        id: "page_1",
        fields: [
          { id: "name", type: "text", label: "Full name", placeholder: "Jane Smith", required: true },
          { id: "email", type: "email", label: "Work email", placeholder: "jane@company.com", required: true },
          {
            id: "company_size",
            type: "select",
            label: "Company size",
            options: [
              { label: "1–10", value: "1-10" },
              { label: "11–50", value: "11-50" },
              { label: "51–200", value: "51-200" },
              { label: "200+", value: "200+" },
            ],
          },
          { id: "message", type: "textarea", label: "What are you building?", placeholder: "Tell us a little about your project…" },
        ],
      },
    ],
    logic: [],
    theme: {},
    settings: { submitBehavior: { type: "message", message: "Thanks — we'll be in touch shortly." } },
  };
}
