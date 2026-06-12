"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FormRow } from "@/components/forms-table";

export default function InboxHubPage() {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetch("/api/forms")
      .then((r) => r.json())
      .then((d) => {
        setForms(d.forms ?? []);
        setLoaded(true);
      });
  }, []);

  const withSubs = useMemo(
    () => forms.filter((f) => f.submissionCount > 0).sort((a, b) => b.submissionCount - a.submissionCount),
    [forms]
  );

  return (
    <div>
      <div className="page-head">
        <h2>Inbox</h2>
      </div>

      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Submissions are scoped per form. Pick a form to review its inbox or spam folder.
        </p>
        {!loaded ? (
          <p className="empty-state">Loading…</p>
        ) : withSubs.length === 0 ? (
          <p className="empty-state">No submissions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Form</th>
                <th>Status</th>
                <th>Submissions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {withSubs.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Link href={`/forms/${f.id}/inbox`} style={{ color: "inherit", fontWeight: 600 }}>
                      {f.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${f.status}`}>{f.status}</span>
                  </td>
                  <td className="num">{f.submissionCount}</td>
                  <td>
                    <Link href={`/forms/${f.id}/inbox`} className="btn secondary small">
                      Open inbox
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
