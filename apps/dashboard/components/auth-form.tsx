"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden style={{ width: 30, height: 30, borderRadius: 9 }}>
      <svg width="15" height="15" viewBox="0 0 13 13" fill="none">
        <rect x="1" y="1.5" width="11" height="2.2" rx="1.1" fill="#fff" />
        <rect x="1" y="5.4" width="8" height="2.2" rx="1.1" fill="#fff" opacity=".85" />
        <rect x="1" y="9.3" width="5" height="2.2" rx="1.1" fill="#fff" opacity=".7" />
      </svg>
    </span>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(d.error ?? "Something went wrong");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <BrandMark />
        <span>Fieldo</span>
      </div>
      <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {mode === "login"
          ? "Sign in to your forms, inbox, and analytics."
          : "Forms with an owned inbox, native rendering, and an agent API."}
      </p>
      <form onSubmit={submit} className="auth-fields">
        {mode === "signup" && (
          <label>
            Name
            <input className="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input className="text" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
        </label>
        <label>
          Password
          <input
            className="text"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>
        {error && <p className="error-text" style={{ margin: 0 }}>{error}</p>}
        <button className="btn" type="submit" disabled={busy} style={{ justifyContent: "center" }}>
          {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="muted" style={{ marginBottom: 0 }}>
        {mode === "login" ? (
          <>New to Fieldo? <Link href="/signup">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login">Sign in</Link></>
        )}
      </p>
    </div>
  );
}
