export type AttentionSeverity = "warn" | "error";

export interface DashboardOverview {
  workspaceName: string;
  kpis: {
    totalSubmissions: number;
    liveForms: number;
    publishedThisWeek: number;
    deliverySuccessPct: number;
    deliveryRetriesPending: number;
    spamBlocked: number;
    submissionTrendPct: number | null;
  };
  dailyActivity: { label: string; count: number }[];
  attention: { id: string; title: string; meta: string; severity: AttentionSeverity; href: string }[];
  inboxFlaggedCount: number;
  portfolio: {
    id: string;
    title: string;
    slug: string;
    status: string;
    submissionCount: number;
    conversionPct: number | null;
    destinations: string;
    updatedAt: number;
    updatedLabel: string;
  }[];
}
