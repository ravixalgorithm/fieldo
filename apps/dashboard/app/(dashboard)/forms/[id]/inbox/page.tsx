"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { FormSchemaV1 } from "@fieldo/types";

interface SubmissionRow {
  id: string;
  answers: Record<string, unknown>;
  email: string | null;
  spamScore: number;
  spamSignals: string[] | null;
  status: "complete" | "flagged" | "rejected";
  embedSource: string | null;
  timeToCompleteMs: number | null;
  readAt: number | null;
  createdAt: number;
}

export default function InboxPage({ params }: { params: { id: string } }) {
  const [subs, setSubs] = useState<SubmissionRow[]>([]);
  const [schema, setSchema] = useState<FormSchemaV1 | null>(null);
  const [folder, setFolder] = useState<"inbox" | "spam">("inbox");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SubmissionRow | null>(null);
  const [counts, setCounts] = useState({ inbox: 0, spam: 0, unread: 0 });

  const loadCounts = useCallback(async () => {
    const [inboxRes, spamRes] = await Promise.all([
      fetch(`/api/forms/${params.id}/submissions?status=complete`),
      fetch(`/api/forms/${params.id}/submissions?status=flagged`),
    ]);
    const inboxData = await inboxRes.json();
    const spamData = await spamRes.json();
    const inboxRows: SubmissionRow[] = inboxData.submissions ?? [];
    setCounts({
      inbox: inboxRows.length,
      spam: (spamData.submissions ?? []).length,
      unread: inboxRows.filter((s) => !s.readAt).length,
    });
  }, [params.id]);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    q.set("status", folder === "spam" ? "flagged" : "complete");
    if (search) q.set("search", search);
    const d = await fetch(`/api/forms/${params.id}/submissions?${q}`).then((r) => r.json());
    setSubs(d.submissions ?? []);
  }, [params.id, folder, search]);

  useEffect(() => {
    void load();
    void loadCounts();
    void fetch(`/api/forms/${params.id}`).then((r) => r.json()).then((d) => setSchema(d.form?.draftSchema ?? null));
  }, [load, loadCounts, params.id]);

  const refresh = useCallback(async () => {
    await Promise.all([load(), loadCounts()]);
  }, [load, loadCounts]);

  const act = async (sid: string, action: string) => {
    await fetch(`/api/forms/${params.id}/submissions/${sid}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setSelected(null);
    void refresh();
  };

  const remove = async (sid: string) => {
    await fetch(`/api/forms/${params.id}/submissions/${sid}`, { method: "DELETE" });
    setSelected(null);
    void refresh();
  };

  const open = (s: SubmissionRow) => {
    setSelected(s);
    if (!s.readAt) {
      void fetch(`/api/forms/${params.id}/submissions/${s.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "read" }),
      }).then(() => refresh());
    }
  };

  const fields = schema?.pages.flatMap((p) => p.fields).filter((f) => f.type !== "statement") ?? [];
  const labelFor = (fid: string) => fields.find((f) => f.id === fid)?.label ?? fid;

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Inbox</h2>
        <div className="row">
          <Link className="btn secondary small" href={`/forms/${params.id}`}>← Back to form</Link>
          <a className="btn secondary small" href={`/api/forms/${params.id}/submissions?format=csv${folder === "spam" ? "&status=flagged" : "&status=complete"}`}>
            Export CSV
          </a>
        </div>
      </div>

      <div className="tabs">
        <button className={folder === "inbox" ? "active" : ""} onClick={() => setFolder("inbox")}>
          Inbox
          <span className="tab-count">{counts.inbox}</span>
          {counts.unread > 0 ? <span className="tab-count alert">{counts.unread}</span> : null}
        </button>
        <button className={folder === "spam" ? "active" : ""} onClick={() => setFolder("spam")}>
          Spam folder
          {counts.spam > 0 ? <span className="tab-count alert">{counts.spam}</span> : <span className="tab-count">0</span>}
        </button>
        <input
          className="text"
          style={{ maxWidth: 240, marginLeft: "auto" }}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          {subs.length === 0 ? (
            <p className="muted" style={{ padding: 20 }}>
              {folder === "spam" ? "No flagged submissions — your spam folder is clean." : "No submissions yet."}
            </p>
          ) : (
            <table>
              <thead>
                <tr><th></th><th>Email / first answer</th><th>Source</th><th>Spam</th><th>Received</th></tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} style={{ cursor: "pointer", fontWeight: s.readAt ? 400 : 700, background: selected?.id === s.id ? "#eef2ff" : undefined }} onClick={() => open(s)}>
                    <td>{s.readAt ? "" : "●"}</td>
                    <td>{s.email ?? String(Object.values(s.answers)[0] ?? "—")}</td>
                    <td className="muted">{s.embedSource ?? "—"}</td>
                    <td>{s.spamScore > 0 ? s.spamScore.toFixed(1) : "—"}</td>
                    <td className="muted">{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>Submission {selected.id}</strong>
              <button className="btn secondary small" onClick={() => setSelected(null)}>✕</button>
            </div>
            <table style={{ marginTop: 12 }}>
              <tbody>
                {Object.entries(selected.answers).map(([fid, v]) => (
                  <tr key={fid}>
                    <th style={{ width: "40%" }}>{labelFor(fid)}</th>
                    <td>{Array.isArray(v) ? v.join(", ") : String(v)}</td>
                  </tr>
                ))}
                <tr><th>Status</th><td><span className={`badge ${selected.status}`}>{selected.status}</span></td></tr>
                <tr><th>Spam signals</th><td className="muted">{selected.spamSignals?.join(", ") || "none"}</td></tr>
                <tr><th>Time to complete</th><td className="muted">{selected.timeToCompleteMs ? `${Math.round(selected.timeToCompleteMs / 1000)}s` : "—"}</td></tr>
              </tbody>
            </table>
            <div className="row" style={{ marginTop: 14 }}>
              {selected.status === "flagged" ? (
                <button className="btn small" onClick={() => act(selected.id, "unspam")}>Not spam — recover</button>
              ) : (
                <button className="btn secondary small" onClick={() => act(selected.id, "spam")}>Mark as spam</button>
              )}
              <button className="btn secondary small" onClick={() => act(selected.id, "unread")}>Mark unread</button>
              <button className="btn danger small" onClick={() => remove(selected.id)}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
