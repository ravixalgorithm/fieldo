import Link from "next/link";
import type { ReactNode } from "react";

export const DEVELOPERS_BASE = "/developers";

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3210";
}

export const DASHBOARD_URL = getAppUrl();

export function devHref(path: string) {
  if (path === "/" || path === "") return DEVELOPERS_BASE;
  return `${DEVELOPERS_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function PageHeader({ title, breadcrumb, children }: { title: string; breadcrumb?: string; children?: ReactNode }) {
  return (
    <header>
      <nav aria-label="Breadcrumb" className="docs-breadcrumb">
        <Link href={DEVELOPERS_BASE}>Documentation</Link>
        <span style={{ margin: "0 6px", color: "var(--ink-300)" }}>/</span>
        <span>{breadcrumb ?? title}</span>
      </nav>
      <h1>{title}</h1>
      {children && <p className="docs-lead">{children}</p>}
    </header>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="docs-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="docs-body">{children}</p>;
}

export function Code({ children }: { children: string }) {
  return <pre className="docs-code">{children}</pre>;
}

export function C({ children }: { children: ReactNode }) {
  return <code className="inline">{children}</code>;
}

export function Callout({ children }: { children: ReactNode }) {
  return <div className="docs-callout">{children}</div>;
}

export function DocTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageFooter() {
  return (
    <footer className="docs-footer">
      Fieldo · forms infrastructure for Framer builders and the AI agents they use ·{" "}
      <Link href="/">Back to dashboard</Link>
    </footer>
  );
}
