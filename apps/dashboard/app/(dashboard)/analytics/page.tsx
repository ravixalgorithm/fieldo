"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FormRow } from "@/components/forms-table";

export default function AnalyticsHubPage() {
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

  const sorted = useMemo(
    () => [...forms].sort((a, b) => b.submissionCount - a.submissionCount),
    [forms]
  );

  return (
    <div>
      <div className="page-head">
        <h2>Analytics</h2>
      </div>

      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Funnel and field-level metrics are scoped per form. Pick a form to view its analytics.
        </p>
        {!loaded ? (
          <p className="empty-state">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="empty-state">No forms yet.</p>
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
              {sorted.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Link href={`/forms/${f.id}/analytics`} style={{ color: "inherit", fontWeight: 600 }}>
                      {f.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${f.status}`}>{f.status}</span>
                  </td>
                  <td className="num">{f.submissionCount}</td>
                  <td>
                    <Link href={`/forms/${f.id}/analytics`} className="btn secondary small">
                      View analytics
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
