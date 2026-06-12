/** Thin HTTP client for the Fieldo dashboard API the MCP tools drive. */

export const API_BASE = process.env.FIELDO_API_URL ?? "http://localhost:3210";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown; raw?: boolean }
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (init?.raw) return (await res.text()) as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `API error ${res.status}`);
  return data as T;
}
