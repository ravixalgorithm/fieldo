"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FieldStat {
  fieldId: string;
  label: string;
  type: string;
  reached: number;
  reachRate: number;
  medianDwellMs: number;
  avgRefocus: number;
  errorCount: number;
  errorRate: number;
}

interface Analytics {
  funnel: { views: number; starts: number; completions: number; startRate: number; completionRate: number };
  fields: FieldStat[];
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function AnalyticsPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    void fetch(`/api/forms/${params.id}/analytics`).then((r) => r.json()).then(setData);
  }, [params.id]);

  if (!data) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Field-level analytics</h2>
        <Link className="btn secondary small" href={`/forms/${params.id}`}>← Back to form</Link>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Funnel</h3>
        <table>
          <tbody>
            <tr><th>Views</th><td>{data.funnel.views}</td></tr>
            <tr><th>Starts</th><td>{data.funnel.starts} <span className="muted">({pct(data.funnel.startRate)} of views)</span></td></tr>
            <tr><th>Completions</th><td>{data.funnel.completions} <span className="muted">({pct(data.funnel.completionRate)} of starts)</span></td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Per-field metrics</h3>
        {data.fields.length === 0 ? (
          <p className="muted">No fields.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Field</th><th>Reach</th><th></th><th>Median dwell</th><th>Avg refocus</th><th>Error rate</th></tr>
            </thead>
            <tbody>
              {data.fields.map((f) => (
                <tr key={f.fieldId}>
                  <td><strong>{f.label}</strong> <span className="muted">({f.type})</span></td>
                  <td>{f.reached} ({pct(f.reachRate)})</td>
                  <td><div className="bar"><div style={{ width: pct(Math.min(f.reachRate, 1)) }} /></div></td>
                  <td>{f.medianDwellMs ? `${(f.medianDwellMs / 1000).toFixed(1)}s` : "—"}</td>
                  <td>{f.avgRefocus || "—"}</td>
                  <td>{f.errorCount ? `${pct(f.errorRate)} (${f.errorCount})` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted">Reach = unique sessions that focused the field. Dwell and refocus come from field focus/blur beacons.</p>
      </div>
    </div>
  );
}
