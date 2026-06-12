import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in — Fieldo" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (getAuth()) redirect("/");
  return <AuthForm mode="login" />;
}
