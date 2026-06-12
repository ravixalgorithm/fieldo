import Link from "next/link";
import type { ReactNode } from "react";

export const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3210";

export function PageHeader({ title, breadcrumb, children }: { title: string; breadcrumb?: string; children?: ReactNode }) {
  return (
    <header>
      <nav aria-label="Breadcrumb" className="docs-breadcrumb">
        <Link href="/">Documentation</Link>
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
      <a href={DASHBOARD_URL}>Open dashboard ↗</a>
    </footer>
  );
}
