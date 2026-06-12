import type { Metadata } from "next";
import { DevelopersDocsNav } from "@/components/developers/docs-nav";

export const metadata: Metadata = {
  title: { default: "Developers", template: "%s — Fieldo Developers" },
  description: "Documentation for the Fieldo MCP server, REST API, and embed surfaces.",
};

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="developers-docs">
      <DevelopersDocsNav />
      <div className="developers-docs-body">{children}</div>
    </div>
  );
}
