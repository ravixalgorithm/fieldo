import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Sans } from "next/font/google";
import { DocsShell } from "@/components/docs-shell";
import "./globals.css";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Fieldo Developers", template: "%s — Fieldo Developers" },
  description: "Documentation for the Fieldo MCP server, REST API, and embed surfaces.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${instrument.variable}`}>
      <body>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
