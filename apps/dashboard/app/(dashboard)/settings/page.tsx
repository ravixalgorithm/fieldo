"use client";

import { useEffect, useState } from "react";

interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [me, setMe] = useState<{ user: { name: string | null; email: string }; workspace: { name: string } } | null>(null);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    void fetch("/api/auth/me").then((r) => r.json()).then(setMe);
    void fetch("/api/keys").then((r) => r.json()).then((d) => setKeys(d.keys ?? []));
  };
  useEffect(load, []);

  const createKey = async () => {
    setBusy(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newKeyName || "API key" }),
    });
    const d = await res.json();
    setBusy(false);
    if (d.key) {
      setFreshSecret(d.key.secret);
      setNewKeyName("");
      load();
    }
  };

  const revoke = async (id: string) => {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="page-head">
        <h2>Settings</h2>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Profile</h3>
        {me ? (
          <table style={{ maxWidth: 480 }}>
            <tbody>
              <tr><th>Name</th><td>{me.user.name ?? "—"}</td></tr>
              <tr><th>Email</th><td>{me.user.email}</td></tr>
              <tr><th>Workspace</th><td>{me.workspace.name}</td></tr>
            </tbody>
          </table>
        ) : (
          <p className="empty-state">Loading…</p>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 4 }}>API keys</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Authenticate the management API and the MCP server: <code className="inline" style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>Authorization: Bearer fld_…</code>.
          Keys are workspace-scoped and shown once.
        </p>
        <div className="row" style={{ marginBottom: 14 }}>
          <input
            className="text"
            style={{ maxWidth: 280 }}
            placeholder="Key name (e.g. Claude MCP)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <button className="btn" disabled={busy} onClick={createKey}>Create key</button>
        </div>
        {freshSecret && (
          <div style={{ marginBottom: 14 }}>
            <p className="muted" style={{ marginBottom: 6 }}>
              <strong>Copy this key now — it won&apos;t be shown again.</strong>
            </p>
            <div className="key-secret">{freshSecret}</div>
          </div>
        )}
        {keys.length === 0 ? (
          <p className="empty-state">No API keys yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Key</th><th>Last used</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 600 }}>{k.name}</td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{k.prefix}…</td>
                  <td className="muted">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "never"}</td>
                  <td className="muted">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td><button className="btn secondary small" onClick={() => revoke(k.id)}>Revoke</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
