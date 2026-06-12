"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormsTable, type FormRow } from "@/components/forms-table";

export default function FormsLibraryPage() {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void fetch("/api/forms")
      .then((r) => r.json())
      .then((d) => {
        setForms(d.forms ?? []);
        setLoaded(true);
      });
  }, []);

  const filtered = useMemo(
    () =>
      forms.filter(
        (f) =>
          (status === "all" || f.status === status) &&
          (!query.trim() || f.title.toLowerCase().includes(query.trim().toLowerCase()) || f.slug.includes(query.trim().toLowerCase()))
      ),
    [forms, query, status]
  );

  const createBlank = async () => {
    setCreating(true);
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Untitled form" }),
    });
    const d = await res.json();
    setCreating(false);
    if (d.form) router.push(`/forms/${d.form.id}`);
  };

  return (
    <div>
      <div className="page-head">
        <h2>Forms</h2>
        <button className="btn" disabled={creating} onClick={createBlank}>+ New form</button>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 14, justifyContent: "space-between" }}>
          <input
            className="text"
            style={{ maxWidth: 320 }}
            placeholder="Search forms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="page-tabs">
            {(["all", "published", "draft"] as const).map((s) => (
              <button key={s} className={status === s ? "current" : ""} onClick={() => setStatus(s)}>
                {s === "all" ? `All (${forms.length})` : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {!loaded ? (
          <p className="empty-state">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">{forms.length === 0 ? "No forms yet — create your first one." : "No forms match your search."}</p>
        ) : (
          <FormsTable forms={filtered} />
        )}
      </div>
    </div>
  );
}
