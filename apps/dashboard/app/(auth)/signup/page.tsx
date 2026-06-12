import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account — Fieldo" };
export const dynamic = "force-dynamic";

export default function SignupPage() {
  if (getAuth()) redirect("/");
  return <AuthForm mode="signup" />;
}
