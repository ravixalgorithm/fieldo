"use client";

import { useRouter } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export function EnterpriseTopBar() {
  const router = useRouter();

  const createForm = async () => {
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Untitled form" }),
    });
    const d = await res.json();
    if (d.form) router.push(`/forms/${d.form.id}`);
  };

  return (
    <header className="enterprise-topbar">
      <div className="enterprise-search" role="search">
        <span className="enterprise-search-icon" aria-hidden>
          ⌕
        </span>
        <input
          type="search"
          className="enterprise-search-input"
          placeholder="Search forms, submissions, destinations…"
          aria-label="Search"
          onKeyDown={(e) => {
            if (e.key === "Enter") router.push("/forms");
          }}
        />
        <kbd className="enterprise-kbd">⌘K</kbd>
      </div>
      <div className="enterprise-topbar-actions">
        <button type="button" className="enterprise-topbar-btn" title="Date range">
          Last 30 days
        </button>
        <button type="button" className="enterprise-topbar-icon" title="Notifications" aria-label="Notifications">
          ◉
        </button>
        <SignOutButton className="enterprise-topbar-btn enterprise-topbar-signout" />
        <button type="button" className="btn" onClick={() => void createForm()}>
          + New form
        </button>
      </div>
    </header>
  );
}
