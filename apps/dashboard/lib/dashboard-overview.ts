import { and, desc, eq, inArray } from "drizzle-orm";
import {
  destinationDeliveries,
  destinations,
  formEvents,
  forms,
  getDb,
  submissions,
} from "@fieldo/db";
import type { DashboardOverview } from "./dashboard-overview-types";

export type { DashboardOverview, AttentionSeverity } from "./dashboard-overview-types";

const DAY_MS = 24 * 60 * 60 * 1000;

function destLabel(type: string): string {
  const map: Record<string, string> = {
    email: "Email",
    webhook: "Webhook",
    slack: "Slack",
    google_sheets: "Sheets",
    notion: "Notion",
  };
  return map[type] ?? type;
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1h ago" : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return days === 1 ? "Yesterday" : `${days}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getDashboardOverview(workspaceId: string, workspaceName: string): DashboardOverview {
  const db = getDb();
  const wsForms = db
    .select()
    .from(forms)
    .where(eq(forms.workspaceId, workspaceId))
    .orderBy(desc(forms.updatedAt))
    .all();
  const formIds = wsForms.map((f) => f.id);
  const formById = new Map(wsForms.map((f) => [f.id, f]));

  if (formIds.length === 0) {
    return {
      workspaceName,
      kpis: {
        totalSubmissions: 0,
        liveForms: 0,
        publishedThisWeek: 0,
        deliverySuccessPct: 100,
        deliveryRetriesPending: 0,
        spamBlocked: 0,
        submissionTrendPct: null,
      },
      dailyActivity: Array.from({ length: 14 }, (_, i) => ({
        label: String(i + 1),
        count: 0,
      })),
      attention: [],
      inboxFlaggedCount: 0,
      portfolio: [],
    };
  }

  const allSubs = db.select().from(submissions).where(inArray(submissions.formId, formIds)).all();
  const completeSubs = allSubs.filter((s) => s.status === "complete");
  const flaggedCount = allSubs.filter((s) => s.status === "flagged").length;
  const rejectedCount = allSubs.filter((s) => s.status === "rejected").length;

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * DAY_MS;
  const sixtyDaysAgo = now - 60 * DAY_MS;
  const weekAgo = now - 7 * DAY_MS;

  const recentComplete = completeSubs.filter((s) => s.createdAt.getTime() >= thirtyDaysAgo);
  const priorComplete = completeSubs.filter(
    (s) => s.createdAt.getTime() >= sixtyDaysAgo && s.createdAt.getTime() < thirtyDaysAgo
  );
  const submissionTrendPct =
    priorComplete.length > 0
      ? Math.round(((recentComplete.length - priorComplete.length) / priorComplete.length) * 1000) / 10
      : recentComplete.length > 0
        ? 100
        : null;

  const liveForms = wsForms.filter((f) => f.status === "published").length;
  const publishedThisWeek = wsForms.filter(
    (f) => f.status === "published" && f.updatedAt.getTime() >= weekAgo
  ).length;

  const destRows = db.select().from(destinations).where(inArray(destinations.formId, formIds)).all();
  const destIds = destRows.map((d) => d.id);
  let deliverySuccessPct = 100;
  let deliveryRetriesPending = 0;
  if (destIds.length > 0) {
    const deliveries = db
      .select()
      .from(destinationDeliveries)
      .where(inArray(destinationDeliveries.destinationId, destIds))
      .all();
    const success = deliveries.filter((d) => d.status === "success").length;
    deliveryRetriesPending = deliveries.filter(
      (d) => d.status === "retrying" || d.status === "failed"
    ).length;
    deliverySuccessPct = deliveries.length ? Math.round((success / deliveries.length) * 1000) / 10 : 100;
  }

  const dailyActivity: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now - i * DAY_MS);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = dayStart.getTime() + DAY_MS;
    const count = recentComplete.filter(
      (s) => s.createdAt.getTime() >= dayStart.getTime() && s.createdAt.getTime() < dayEnd
    ).length;
    dailyActivity.push({
      label: dayStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    });
  }

  const attention: DashboardOverview["attention"] = [];

  if (destIds.length > 0) {
    const failing = db
      .select()
      .from(destinationDeliveries)
      .where(
        and(
          inArray(destinationDeliveries.destinationId, destIds),
          inArray(destinationDeliveries.status, ["failed", "retrying"])
        )
      )
      .all()
      .slice(0, 3);

    for (const d of failing) {
      const dest = destRows.find((r) => r.id === d.destinationId);
      const form = dest ? formById.get(dest.formId) : undefined;
      attention.push({
        id: d.id,
        title: `${destLabel(dest?.type ?? "webhook")} delivery failing — ${form?.title ?? "Form"}`,
        meta: `Attempt ${d.attempts}${d.errorDetail ? ` · ${d.errorDetail.slice(0, 60)}` : ""}`,
        severity: d.status === "failed" ? "error" : "warn",
        href: form ? `/forms/${form.id}` : "/forms",
      });
    }
  }

  if (flaggedCount > 0) {
    const flaggedForms = new Map<string, number>();
    for (const s of allSubs.filter((x) => x.status === "flagged")) {
      flaggedForms.set(s.formId, (flaggedForms.get(s.formId) ?? 0) + 1);
    }
    const top = [...flaggedForms.entries()].sort((a, b) => b[1] - a[1])[0];
    const form = top ? formById.get(top[0]) : undefined;
    attention.push({
      id: "spam-review",
      title: `${flaggedCount} submission${flaggedCount === 1 ? "" : "s"} flagged for spam review`,
      meta: form ? `${form.title} · review in inbox` : "Review in form inboxes",
      severity: "error",
      href: form ? `/forms/${form.id}/inbox` : "/forms",
    });
  }

  const staleDrafts = wsForms.filter(
    (f) => f.status === "draft" && f.updatedAt.getTime() < now - 14 * DAY_MS
  );
  for (const f of staleDrafts.slice(0, 2)) {
    attention.push({
      id: `draft-${f.id}`,
      title: `Draft form unpublished ${Math.floor((now - f.updatedAt.getTime()) / DAY_MS)} days`,
      meta: `${f.title} · no live version`,
      severity: "warn",
      href: `/forms/${f.id}`,
    });
  }

  const events =
    formIds.length > 0
      ? db.select().from(formEvents).where(inArray(formEvents.formId, formIds)).all()
      : [];

  const portfolio = wsForms.map((form) => {
    const dests = destRows.filter((d) => d.formId === form.id && d.enabled);
    const destSummary =
      dests.length > 0 ? dests.map((d) => destLabel(d.type)).join(" · ") : "Not configured";

    const starts = new Set(
      events.filter((e) => e.formId === form.id && e.eventType === "form_start").map((e) => e.sessionId)
    ).size;
    const completes = allSubs.filter((s) => s.formId === form.id && s.status === "complete").length;
    const conversionPct = starts > 0 ? Math.round((completes / starts) * 100) : null;

    return {
      id: form.id,
      title: form.title,
      slug: form.slug,
      status: form.status,
      submissionCount: form.submissionCount,
      conversionPct,
      destinations: destSummary,
      updatedAt: form.updatedAt.getTime(),
      updatedLabel: relativeTime(form.updatedAt.getTime()),
    };
  });

  return {
    workspaceName,
    kpis: {
      totalSubmissions: completeSubs.length,
      liveForms,
      publishedThisWeek,
      deliverySuccessPct,
      deliveryRetriesPending,
      spamBlocked: rejectedCount,
      submissionTrendPct,
    },
    dailyActivity,
    attention: attention.slice(0, 5),
    inboxFlaggedCount: flaggedCount,
    portfolio,
  };
}

export { relativeTime };
