/**
 * Submission fan-out (PRD §5.3.9 step 8) — in-process for local dev; the same
 * delivery functions move behind BullMQ when the worker app ships.
 *
 * Per enabled destination: a delivery audit row is created, the send is
 * attempted with exponential backoff (FANOUT_RETRY_BASE_MS, default 5s:
 * 5s → 25s → 125s), and the row tracks pending|retrying|success|failed.
 */
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb, destinations, destinationDeliveries, nanoid } from "@fieldo/db";
import type { Answers, FormSchemaV1 } from "@fieldo/types";

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = Number(process.env.FANOUT_RETRY_BASE_MS ?? 5000);

export interface FanoutPayload {
  submissionId: string;
  formId: string;
  formTitle: string;
  answers: Answers;
  email: string | null;
  createdAt: string;
  embedSource: string | null;
}

type DestRow = typeof destinations.$inferSelect;

function answersAsText(schema: FormSchemaV1, answers: Answers): string {
  const lines: string[] = [];
  for (const page of schema.pages) {
    for (const f of page.fields) {
      if (f.type === "statement" || !(f.id in answers)) continue;
      const v = answers[f.id];
      lines.push(`${f.label}: ${Array.isArray(v) ? v.join(", ") : String(v ?? "")}`);
    }
  }
  return lines.join("\n");
}

async function deliverWebhook(dest: DestRow, payload: FanoutPayload): Promise<void> {
  const config = dest.config as { url: string; secret?: string };
  const body = JSON.stringify({ event: "submission.created", ...payload });
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.secret) {
    headers["x-fieldo-signature"] =
      "sha256=" + crypto.createHmac("sha256", config.secret).update(body).digest("hex");
  }
  const res = await fetch(config.url, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
}

async function deliverSlack(dest: DestRow, payload: FanoutPayload, schema: FormSchemaV1): Promise<void> {
  const config = dest.config as { webhookUrl: string };
  const res = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: `New submission on *${payload.formTitle}*\n${answersAsText(schema, payload.answers)}`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Slack responded ${res.status}`);
}

async function deliverEmail(dest: DestRow, payload: FanoutPayload, schema: FormSchemaV1): Promise<void> {
  const config = dest.config as { to?: string; autoResponder?: boolean; subject?: string };
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  const to = config.autoResponder ? payload.email : config.to;
  if (!to) throw new Error(config.autoResponder ? "Submission has no email to auto-respond to" : "Destination has no recipient");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: process.env.FIELDO_EMAIL_FROM ?? "Fieldo <notifications@fieldo.io>",
      to,
      subject: config.subject ?? (config.autoResponder ? `Thanks for your submission` : `New submission: ${payload.formTitle}`),
      text: config.autoResponder
        ? `Thanks — your response to "${payload.formTitle}" has been recorded.`
        : `${answersAsText(schema, payload.answers)}\n\n— ${payload.submissionId}`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
}

function attempt(dest: DestRow, deliveryId: string, payload: FanoutPayload, schema: FormSchemaV1, attemptNo: number) {
  const db = getDb();
  const send =
    dest.type === "webhook"
      ? deliverWebhook(dest, payload)
      : dest.type === "slack"
        ? deliverSlack(dest, payload, schema)
        : dest.type === "email"
          ? deliverEmail(dest, payload, schema)
          : Promise.reject(new Error(`Destination type ${dest.type} ships post-v1`));

  send
    .then(() => {
      db.update(destinationDeliveries)
        .set({ status: "success", attempts: attemptNo, lastAttemptAt: new Date(), errorDetail: null })
        .where(eq(destinationDeliveries.id, deliveryId))
        .run();
    })
    .catch((e: unknown) => {
      const message = e instanceof Error ? e.message : String(e);
      const willRetry = attemptNo < MAX_ATTEMPTS;
      db.update(destinationDeliveries)
        .set({
          status: willRetry ? "retrying" : "failed",
          attempts: attemptNo,
          lastAttemptAt: new Date(),
          errorDetail: message,
        })
        .where(eq(destinationDeliveries.id, deliveryId))
        .run();
      if (willRetry) {
        const delay = BASE_DELAY_MS * Math.pow(5, attemptNo - 1);
        const t = setTimeout(() => attempt(dest, deliveryId, payload, schema, attemptNo + 1), delay);
        if (typeof t === "object" && "unref" in t) t.unref(); // don't hold the dev server open
      }
    });
}

/** Fire-and-forget: never blocks or fails the submit response. */
export function enqueueFanout(payload: FanoutPayload, schema: FormSchemaV1): void {
  try {
    const db = getDb();
    const dests = db
      .select()
      .from(destinations)
      .where(and(eq(destinations.formId, payload.formId), eq(destinations.enabled, true)))
      .all();
    for (const dest of dests) {
      const deliveryId = "dlv_" + nanoid(12);
      db.insert(destinationDeliveries)
        .values({
          id: deliveryId,
          destinationId: dest.id,
          submissionId: payload.submissionId,
          status: "pending",
          attempts: 0,
          createdAt: new Date(),
        })
        .run();
      attempt(dest, deliveryId, payload, schema, 1);
    }
  } catch (e) {
    console.error("fanout enqueue failed:", e);
  }
}
