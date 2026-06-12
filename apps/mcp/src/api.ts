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
  const headers: Record<string, string> = {};
  if (init?.body !== undefined) headers["content-type"] = "application/json";
  if (process.env.FIELDO_API_KEY) headers.authorization = `Bearer ${process.env.FIELDO_API_KEY}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: init?.method ?? "GET",
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (init?.raw) return (await res.text()) as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `API error ${res.status}`);
  return data as T;
}
