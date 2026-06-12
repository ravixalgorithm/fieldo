import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fieldo",
  description: "Design-native forms with an owned inbox, field-level analytics, and an AI-agent API.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">⬚ Fieldo</Link>
          <span className="tagline">Forms with an inbox. Native rendering. No iframe.</span>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
