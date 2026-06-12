"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export function UserCard({ name, email }: { name: string | null; email: string }) {
  const router = useRouter();
  const display = name?.trim() || email.split("@")[0];
  const initial = display[0]?.toUpperCase() ?? "F";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="side-user">
      <Link href="/settings" className="side-user-main" title="Settings">
        <span className="side-avatar">{initial}</span>
        <span className="side-user-text">
          <span className="n">{display}</span>
          <span className="e">{email}</span>
        </span>
      </Link>
      <button className="side-logout" onClick={logout} title="Sign out">⎋</button>
    </div>
  );
}
