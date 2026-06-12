"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export function UserCard({
  name,
  email,
  role = "Owner",
}: {
  name: string | null;
  email: string;
  role?: string;
}) {
  const display = name?.trim() || email.split("@")[0];
  const initial = display[0]?.toUpperCase() ?? "F";

  return (
    <div className="side-user enterprise-user">
      <Link href="/settings" className="side-user-main" title="Settings">
        <span className="side-avatar">{initial}</span>
        <span className="side-user-text">
          <span className="n">{display}</span>
          <span className="e">{role}</span>
        </span>
      </Link>
      <SignOutButton />
    </div>
  );
}
