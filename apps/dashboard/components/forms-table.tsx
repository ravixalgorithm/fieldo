"use client";

import Link from "next/link";

export interface FormRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  submissionCount: number;
  updatedAt: number | string;
}

export function FormsTable({ forms }: { forms: FormRow[] }) {
  return (
    <table>
      <thead>
        <tr><th>Title</th><th>Status</th><th>Submissions</th><th>Link</th><th>Updated</th></tr>
      </thead>
      <tbody>
        {forms.map((f) => (
          <tr key={f.id}>
            <td><Link href={`/forms/${f.id}`} style={{ color: "inherit", fontWeight: 600 }}>{f.title}</Link></td>
            <td><span className={`badge ${f.status}`}>{f.status}</span></td>
            <td className="num"><Link href={`/forms/${f.id}/inbox`}>{f.submissionCount} →</Link></td>
            <td>
              {f.status === "published" ? (
                <a href={`/f/${f.slug}`} target="_blank" className="muted" style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                  /f/{f.slug}
                </a>
              ) : (
                <span className="muted">—</span>
              )}
            </td>
            <td className="muted tabular">
              {new Date(f.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function contactTemplate(title: string) {
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
