import Link from "next/link";
import { redirect } from "next/navigation";
import { SideNav } from "@/components/side-nav";
import { UserCard } from "@/components/user-card";
import { getAuth } from "@/lib/auth";

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <Link href="/" className="brand">
            <BrandMark />
            Fieldo
          </Link>
          <div className="sidebar-divider" />
          <SideNav />
        </div>
        <div>
          <nav className="side-nav" style={{ marginBottom: 10 }}>
            <Link href="/settings">
              <span className="nav-icon">⚙</span>
              Settings
            </Link>
            <a href="http://localhost:3211" target="_blank" rel="noreferrer">
              <span className="nav-icon">⌬</span>
              Developers ↗
            </a>
          </nav>
          <UserCard name={ctx.user.name} email={ctx.user.email} />
        </div>
      </aside>
      <div className="content-area">
        <div className="content-panel">
          <div className="content-scroll">
            <main className="main">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
