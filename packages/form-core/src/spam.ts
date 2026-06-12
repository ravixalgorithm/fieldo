import type { Answers, FormSchemaV1 } from "@fieldo/types";

export interface SpamInput {
  /** value of the honeypot field, if present in the raw body */
  honeypotValue?: string;
  /** seconds between render-token issue and submit (null = no/invalid token) */
  secondsSinceRender: number | null;
  answers: Answers;
  schema: FormSchemaV1;
}

export interface SpamVerdict {
  score: number;
  signals: string[];
  status: "pass" | "flag" | "reject";
}

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "sharklasers.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
]);

const SPAM_KEYWORDS = ["viagra", "casino", "crypto pump", "seo service", "backlinks", "escort", "loan approval"];

/** Cumulative spam scoring per PRD 5.3.4. */
export function scoreSubmission(input: SpamInput): SpamVerdict {
  const signals: string[] = [];
  let score = 0;

  // 1. Honeypot
  if (input.honeypotValue) {
    score += 1.0;
    signals.push("honeypot_filled");
  }

  // 2. Time trap (signed render token verified by caller)
  const minSeconds = input.schema.settings.spam?.minSecondsToSubmit ?? 3;
  if (input.secondsSinceRender === null) {
    score += 0.6;
    signals.push("missing_or_invalid_render_token");
  } else if (input.secondsSinceRender < minSeconds) {
    score += 0.6;
    signals.push(`too_fast:${input.secondsSinceRender}s`);
  }

  // 3. Disposable email
  for (const v of Object.values(input.answers)) {
    if (typeof v === "string" && v.includes("@")) {
      const domain = v.split("@").pop()?.toLowerCase() ?? "";
      if (DISPOSABLE_DOMAINS.has(domain)) {
        score += 0.3;
        signals.push(`disposable_email:${domain}`);
      }
    }
  }

  // 4. Link count + keyword heuristics
  const text = Object.values(input.answers)
    .filter((v): v is string => typeof v === "string")
    .join(" ")
    .toLowerCase();
  const linkCount = (text.match(/https?:\/\//g) ?? []).length;
  if (linkCount >= 3) {
    score += 0.2;
    signals.push(`link_count:${linkCount}`);
  }
  if (SPAM_KEYWORDS.some((k) => text.includes(k))) {
    score += 0.2;
    signals.push("spam_keywords");
  }

  const flagAt = input.schema.settings.spam?.flagThreshold ?? 0.5;
  const rejectAt = input.schema.settings.spam?.rejectThreshold ?? 1.0;
  const status = score >= rejectAt ? "reject" : score >= flagAt ? "flag" : "pass";
  return { score: Math.round(score * 100) / 100, signals, status };
}

export const HONEYPOT_FIELD_NAME = "_fieldo_website";
