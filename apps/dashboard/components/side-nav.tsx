"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
  badge?: number;
  match?: (pathname: string) => boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const body = (
    <>
      <span className="nav-icon">{item.icon}</span>
      <span className="nav-label">{item.label}</span>
      {item.badge != null && item.badge > 0 ? (
        <span className="nav-badge">{item.badge > 99 ? "99+" : item.badge}</span>
      ) : null}
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={active ? "active" : ""}>
        {body}
      </a>
    );
  }

  return (
    <Link href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
      {body}
    </Link>
  );
}

export function SideNav({ inboxBadge = 0 }: { inboxBadge?: number }) {
  const pathname = usePathname() ?? "/";

  const navActive = (item: NavItem) => {
    if (item.match) return item.match(pathname);
    if (item.href === "/") return pathname === "/";
    if (item.href === "/developers") return pathname === "/developers";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const groups: NavGroup[] = [
    {
      title: "Primary",
      items: [
        { label: "Overview", href: "/", icon: "◧" },
        {
          label: "Forms",
          href: "/forms",
          icon: "▤",
          match: (p) =>
            p === "/forms" ||
            (/^\/forms\/[^/]+$/.test(p) && !p.endsWith("/inbox") && !p.endsWith("/analytics")),
        },
        {
          label: "Inbox",
          href: "/inbox",
          icon: "▣",
          badge: inboxBadge,
          match: (p) => p === "/inbox" || /\/inbox(\/|$)/.test(p),
        },
      ],
    },
    {
      title: "Workspace",
      items: [
        {
          label: "Analytics",
          href: "/analytics",
          icon: "◫",
          match: (p) => p === "/analytics" || /\/analytics(\/|$)/.test(p),
        },
        {
          label: "API Keys",
          href: "/settings",
          icon: "⌁",
          match: (p) => p === "/settings",
        },
      ],
    },
    {
      title: "Developers",
      items: [
        { label: "Overview", href: "/developers", icon: "◧" },
        { label: "MCP Server", href: "/developers/mcp-server", icon: "⌬" },
        { label: "MCP Tools", href: "/developers/tools", icon: "⚒" },
        { label: "REST API", href: "/developers/rest-api", icon: "⇄" },
        { label: "Embeds", href: "/developers/embeds", icon: "▤" },
      ],
    },
    {
      title: "Admin",
      items: [{ label: "Settings", href: "/settings", icon: "⚙" }],
    },
  ];

  return (
    <nav className="side-nav enterprise-nav">
      {groups.map((group) => (
        <div key={group.title} className="nav-group">
          <div className="nav-group-title">{group.title}</div>
          {group.items.map((item) => (
            <NavLink key={`${group.title}-${item.label}`} item={item} active={navActive(item)} />
          ))}
        </div>
      ))}
    </nav>
  );
}
