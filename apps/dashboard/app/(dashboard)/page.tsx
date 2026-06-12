"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DashboardOverview } from "@/lib/dashboard-overview-types";

function formatNum(n: number): string {
  return n.toLocaleString();
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="sparkline" aria-hidden>
      {values.map((v, i) => (
        <span key={i} style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

function ActivityChart({ daily }: { daily: DashboardOverview["dailyActivity"] }) {
  const max = Math.max(...daily.map((d) => d.count), 1);
  return (
    <div className="activity-chart">
      <div className="activity-bars">
        {daily.map((d) => (
          <div key={d.label} className="activity-bar-col" title={`${d.label}: ${d.count}`}>
            <div className="activity-bar" style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="activity-labels">
        <span>{daily[0]?.label}</span>
        <span>{daily[Math.floor(daily.length / 2)]?.label}</span>
        <span>{daily[daily.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "published" ? "published" : status === "draft" ? "draft" : status === "closed" ? "rejected" : "draft";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function HomePage() {
  const router = useRouter();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [showAi, setShowAi] = useState(false);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    void fetch("/api/dashboard/overview")
      .then((r) => r.json())
      .then((d) => {
        setOverview(d);
        setLoaded(true);
      });
  }, []);

  const sparkValues = useMemo(
    () => overview?.dailyActivity.slice(-7).map((d) => d.count) ?? [0, 0, 0, 0, 0, 0, 0],
    [overview]
  );

  const portfolio = useMemo(() => {
    if (!overview) return [];
    if (statusFilter === "all") return overview.portfolio;
    return overview.portfolio.filter((p) => p.status === statusFilter);
  }, [overview, statusFilter]);

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

  if (!loaded || !overview) {
    return <p className="empty-state">Loading command center…</p>;
  }

  const { kpis, dailyActivity, attention } = overview;
  const trend =
    kpis.submissionTrendPct != null
      ? `${kpis.submissionTrendPct >= 0 ? "+" : ""}${kpis.submissionTrendPct}% vs prior 30d`
      : "No prior period data";

  return (
    <div className="command-center">
      <div className="command-head">
        <div>
          <p className="command-eyebrow">Command center</p>
          <h1 className="command-title">Overview</h1>
          <p className="command-subtitle muted">
            {overview.workspaceName} · submissions, deliveries, and forms at a glance
          </p>
        </div>
        <button type="button" className="btn secondary" onClick={() => setShowAi((v) => !v)}>
          {showAi ? "Hide AI create" : "Create with AI"}
        </button>
      </div>

      {showAi && (
        <div className="card create-panel command-ai">
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>Start with AI</h3>
          <p className="muted" style={{ marginTop: 0, marginBottom: 14 }}>
            Describe the form and AI drafts fields, pages, and logic for you.
          </p>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input
              className="text"
              placeholder="A contact form asking name, work email, company size"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void generate()}
            />
            <button
              className="btn accent"
              style={{ flex: "none" }}
              disabled={creating || !description.trim()}
              onClick={() => void generate()}
            >
              {creating ? "Generating…" : "Generate"}
            </button>
          </div>
          {aiError && (
            <p className="error-text" style={{ marginTop: 8 }}>
              {aiError}
            </p>
          )}
        </div>
      )}

      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-label">Total submissions</div>
          <div className="kpi-value tabular">{formatNum(kpis.totalSubmissions)}</div>
          <div className="kpi-meta muted">{trend}</div>
          <Sparkline values={sparkValues} />
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Live forms</div>
          <div className="kpi-value tabular">{kpis.liveForms}</div>
          <div className="kpi-meta muted">
            {kpis.publishedThisWeek > 0 ? `${kpis.publishedThisWeek} updated this week` : "No publishes this week"}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Delivery success</div>
          <div className="kpi-value tabular">{kpis.deliverySuccessPct}%</div>
          <div className="kpi-meta muted">
            {kpis.deliveryRetriesPending > 0
              ? `${kpis.deliveryRetriesPending} pending retries`
              : "All destinations healthy"}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Spam blocked</div>
          <div className="kpi-value tabular">{formatNum(kpis.spamBlocked)}</div>
          <div className="kpi-meta muted">
            {overview.inboxFlaggedCount > 0
              ? `${overview.inboxFlaggedCount} flagged for review`
              : "Inbox clear"}
          </div>
        </div>
      </div>

      <div className="command-grid">
        <section className="command-panel">
          <div className="panel-head">
            <h3>Submission activity</h3>
            <span className="muted">Last 14 days</span>
          </div>
          <ActivityChart daily={dailyActivity} />
        </section>

        <section className="command-panel">
          <div className="panel-head">
            <h3>Needs attention</h3>
            {attention.length > 0 && <span className="attention-count">{attention.length}</span>}
          </div>
          {attention.length === 0 ? (
            <p className="empty-state">Nothing needs attention — you&apos;re all caught up.</p>
          ) : (
            <ul className="attention-list">
              {attention.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className={`attention-item ${item.severity}`}>
                    <span className="attention-dot" />
                    <span className="attention-body">
                      <span className="attention-title">{item.title}</span>
                      <span className="attention-meta muted">{item.meta}</span>
                    </span>
                    <span className="attention-arrow">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="command-panel portfolio-panel">
        <div className="panel-head">
          <h3>Form portfolio</h3>
          <div className="portfolio-filters">
            {(["all", "published", "draft"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={statusFilter === f ? "filter active" : "filter"}
                onClick={() => setStatusFilter(f)}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {portfolio.length === 0 ? (
          <p className="empty-state">No forms yet — use New form to create your first one.</p>
        ) : (
          <div className="portfolio-table-wrap">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Form</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Conv.</th>
                  <th>Destinations</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/forms/${row.id}`} className="portfolio-form-link">
                        <span className="portfolio-form-title">{row.title}</span>
                        <span className="portfolio-form-slug muted">/f/{row.slug}</span>
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="tabular">{formatNum(row.submissionCount)}</td>
                    <td className="tabular">{row.conversionPct != null ? `${row.conversionPct}%` : "—"}</td>
                    <td className="portfolio-dest">{row.destinations}</td>
                    <td className="muted tabular">{row.updatedLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="portfolio-foot">
          <Link href="/forms">View all forms →</Link>
        </div>
      </section>
    </div>
  );
}
