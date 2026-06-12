"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEVELOPERS_BASE } from "@/components/developers/docs";

const NAV: { label: string; href: string; icon: string; exact?: boolean }[] = [
  { label: "Overview", href: DEVELOPERS_BASE, icon: "◧", exact: true },
  { label: "MCP Server", href: `${DEVELOPERS_BASE}/mcp-server`, icon: "⌬" },
  { label: "MCP Tools", href: `${DEVELOPERS_BASE}/tools`, icon: "⚒" },
  { label: "REST API", href: `${DEVELOPERS_BASE}/rest-api`, icon: "⇄" },
  { label: "Embeds", href: `${DEVELOPERS_BASE}/embeds`, icon: "▤" },
];

export function DevelopersDocsNav() {
  const pathname = usePathname() ?? DEVELOPERS_BASE;

  return (
    <nav className="developers-docs-nav" aria-label="Developer documentation">
      <p className="developers-docs-nav-label">Developer docs</p>
      {NAV.map(({ label, href, icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <span className="nav-icon">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
