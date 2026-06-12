import Link from "next/link";
import { redirect } from "next/navigation";
import { SideNav } from "@/components/side-nav";
import { UserCard } from "@/components/user-card";
import { EnterpriseTopBar } from "@/components/enterprise-top-bar";
import { getAuth } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard-overview";

export const dynamic = "force-dynamic";

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1" y="1.5" width="11" height="2.2" rx="1.1" fill="#fff" />
        <rect x="1" y="5.4" width="8" height="2.2" rx="1.1" fill="#fff" opacity=".85" />
        <rect x="1" y="9.3" width="5" height="2.2" rx="1.1" fill="#fff" opacity=".7" />
      </svg>
    </span>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = getAuth();
  if (!ctx || !ctx.user) redirect("/login");

  const overview = getDashboardOverview(ctx.workspaceId, ctx.workspaceName);

  return (
    <div className="app-shell enterprise-shell">
      <aside className="sidebar enterprise-sidebar">
        <div>
          <Link href="/" className="brand">
            <BrandMark />
            Fieldo
          </Link>
          <div className="workspace-switcher">
            <div className="workspace-switcher-main">
              <span className="workspace-name">{ctx.workspaceName}</span>
              <span className="workspace-badge">PRO</span>
            </div>
            <span className="workspace-chevron" aria-hidden>
              ▾
            </span>
          </div>
          <div className="sidebar-divider" />
          <SideNav inboxBadge={overview.inboxFlaggedCount} />
        </div>
        <UserCard name={ctx.user.name} email={ctx.user.email} />
      </aside>
      <div className="enterprise-main">
        <EnterpriseTopBar />
        <div className="enterprise-content">
          <main className="main enterprise-page">{children}</main>
        </div>
      </div>
    </div>
  );
}
