"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function SignOutButton({
  className = "side-logout-btn",
  children = "Sign out",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <button type="button" className={className} onClick={() => void signOut()}>
      {children}
    </button>
  );
}
