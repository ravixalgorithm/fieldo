import Link from "next/link";
import { SideNav } from "@/components/side-nav";

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
            <a href="http://localhost:3211" target="_blank" rel="noreferrer">
              <span className="nav-icon">⌬</span>
              Developers ↗
            </a>
          </nav>
          <div className="side-foot">
            <span>Local workspace</span>
          </div>
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
