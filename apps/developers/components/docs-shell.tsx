"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DASHBOARD_URL } from "./docs";

const NAV = [
  { label: "Overview", href: "/", icon: "◧" },
  { label: "MCP Server", href: "/mcp-server", icon: "⌬" },
  { label: "MCP Tools", href: "/tools", icon: "⚒" },
  { label: "REST API", href: "/rest-api", icon: "⇄" },
  { label: "Embeds", href: "/embeds", icon: "▤" },
] as const;

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

export function DocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <div className="docs-shell">
      <aside className="docs-sidebar">
        <div>
          <Link href="/" className="brand">
            <BrandMark />
            Fieldo
            <span className="beta">DEVELOPERS</span>
          </Link>
          <div className="docs-divider" />
          <p className="docs-nav-label">Documentation</p>
          <nav className="docs-nav">
            {NAV.map(({ label, href, icon }) => (
              <Link key={href} href={href} className={isActive(href) ? "active" : ""} aria-current={isActive(href) ? "page" : undefined}>
                <span className="nav-icon">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
          <p className="docs-nav-label">Resources</p>
          <nav className="docs-nav">
            <a href={DASHBOARD_URL}>
              <span className="nav-icon">↗</span>
              Open Dashboard
            </a>
            <a href="https://github.com/modelcontextprotocol" target="_blank" rel="noreferrer">
              <span className="nav-icon">⌬</span>
              About MCP
            </a>
          </nav>
        </div>
        <div className="docs-foot">
          <span className="brand-mark" aria-hidden style={{ width: 28, height: 28 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="1.5" width="11" height="2.2" rx="1.1" fill="#fff" />
              <rect x="1" y="5.4" width="8" height="2.2" rx="1.1" fill="#fff" opacity=".85" />
              <rect x="1" y="9.3" width="5" height="2.2" rx="1.1" fill="#fff" opacity=".7" />
            </svg>
          </span>
          <div>
            <div className="t">Fieldo MCP Server</div>
            <div className="s">31 tools · v0.1 · local</div>
          </div>
        </div>
      </aside>
      <main className="docs-pane">
        <div className="docs-panel">
          <article className="docs-article">{children}</article>
        </div>
      </main>
    </div>
  );
}
