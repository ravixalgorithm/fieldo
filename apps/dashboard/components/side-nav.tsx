"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "Dashboard", href: "/", icon: "◧" },
  { label: "Forms", href: "/forms", icon: "▤" },
] as const;

export function SideNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="side-nav">
      {ITEMS.map(({ label, href, icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
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
