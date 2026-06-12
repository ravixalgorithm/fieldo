/**
 * Populates the local SQLite DB with a demo workspace for design / QA handoff.
 * Run: pnpm --filter @fieldo/dashboard seed:demo
 */
import crypto from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import {
  apiKeys,
  destinationDeliveries,
  destinations,
  formEvents,
  formVersions,
  forms,
  getDb,
  nanoid,
  partialSubmissions,
  submissions,
  users,
  workspaceMembers,
  workspaces,
} from "@fieldo/db";
import type { FormSchemaV1 } from "@fieldo/types";
import { hashPassword } from "./auth";
import { publishForm } from "./forms";

export const DEMO_ACCOUNT = {
  email: "designer@fieldo.demo",
  password: "design-demo",
  name: "Alex Rivera",
  workspaceName: "Acme Corp",
  userId: "usr_demo_designer",
  workspaceId: "ws_demo_acme",
  memberId: "mem_demo_owner",
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number, hour = 12): Date {
  const d = new Date(Date.now() - days * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function contactSchema(title: string): FormSchemaV1 {
  return {
    schemaVersion: 1,
    title,
    pages: [
      {
        id: "page_1",
        fields: [
          { id: "name", type: "text", label: "Full name", placeholder: "Jane Smith", required: true },
          { id: "email", type: "email", label: "Work email", placeholder: "jane@company.com", required: true },
          {
            id: "company_size",
            type: "select",
            label: "Company size",
            options: [
              { label: "1–10", value: "1-10" },
              { label: "11–50", value: "11-50" },
              { label: "51–200", value: "51-200" },
              { label: "200+", value: "200+" },
            ],
          },
          { id: "message", type: "textarea", label: "What are you building?", placeholder: "Tell us about your project…" },
        ],
      },
    ],
    logic: [],
    theme: { primaryColor: "#0f766e" },
    settings: { submitBehavior: { type: "message", message: "Thanks — we'll be in touch shortly." } },
  };
}

function waitlistSchema(): FormSchemaV1 {
  return {
    schemaVersion: 1,
    title: "Product waitlist",
    pages: [
      {
        id: "page_1",
        fields: [
          { id: "name", type: "text", label: "Full name", required: true },
          { id: "email", type: "email", label: "Work email", required: true },
          { id: "company", type: "text", label: "Company", required: true },
          {
            id: "role",
            type: "select",
            label: "Your role",
            options: [
              { label: "Founder", value: "founder" },
              { label: "Product", value: "product" },
              { label: "Engineering", value: "engineering" },
              { label: "Marketing", value: "marketing" },
            ],
          },
          {
            id: "use_case",
            type: "multi-select",
            label: "Primary use case",
            options: [
              { label: "Lead capture", value: "leads" },
              { label: "Customer feedback", value: "feedback" },
              { label: "Internal ops", value: "ops" },
              { label: "Events", value: "events" },
            ],
          },
        ],
      },
    ],
    logic: [],
    theme: { primaryColor: "#0f766e" },
    settings: { submitBehavior: { type: "message", message: "You're on the list — we'll email you when we launch." } },
  };
}

function feedbackSchema(): FormSchemaV1 {
  return {
    schemaVersion: 1,
    title: "Customer feedback",
    pages: [
      {
        id: "page_1",
        fields: [
          { id: "email", type: "email", label: "Email", required: true },
          { id: "rating", type: "rating", label: "Overall experience", required: true },
          { id: "feature", type: "select", label: "What did you use most?", options: [
            { label: "Form builder", value: "builder" },
            { label: "Inbox", value: "inbox" },
            { label: "Analytics", value: "analytics" },
            { label: "API", value: "api" },
          ]},
          { id: "comments", type: "textarea", label: "Anything we should improve?" },
        ],
      },
    ],
    logic: [],
    theme: {},
    settings: { submitBehavior: { type: "message", message: "Thank you for the feedback!" } },
  };
}

const FIRST_NAMES = ["Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Jamie", "Drew"];
const LAST_NAMES = ["Chen", "Patel", "Nguyen", "Brooks", "Kim", "Martinez", "Foster", "Ali", "Wright", "Sato"];
const COMPANIES = ["Northwind Labs", "Brightside Health", "Parcel", "Lumen AI", "Stackform", "Riverbank Co", "Atlas Ops", "Clearpath", "Nova Studio", "Fieldline"];

function randomPerson() {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const company = pick(COMPANIES);
  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return {
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${slug}.com`,
    company,
  };
}

function clearWorkspace(workspaceId: string) {
  const db = getDb();
  const formIds = db.select({ id: forms.id }).from(forms).where(eq(forms.workspaceId, workspaceId)).all().map((f) => f.id);
  if (formIds.length === 0) return;

  const destIds = db
    .select({ id: destinations.id })
    .from(destinations)
    .where(inArray(destinations.formId, formIds))
    .all()
    .map((d) => d.id);

  if (destIds.length) {
    db.delete(destinationDeliveries).where(inArray(destinationDeliveries.destinationId, destIds)).run();
    db.delete(destinations).where(inArray(destinations.id, destIds)).run();
  }
  db.delete(submissions).where(inArray(submissions.formId, formIds)).run();
  db.delete(formEvents).where(inArray(formEvents.formId, formIds)).run();
  db.delete(partialSubmissions).where(inArray(partialSubmissions.formId, formIds)).run();
  db.delete(formVersions).where(inArray(formVersions.formId, formIds)).run();
  db.delete(forms).where(inArray(forms.id, formIds)).run();
  db.delete(apiKeys).where(eq(apiKeys.workspaceId, workspaceId)).run();
}

function ensureDemoAccount() {
  const db = getDb();
  const now = new Date();
  const existing = db.select().from(users).where(eq(users.email, DEMO_ACCOUNT.email)).get();

  if (existing) {
    db.update(users)
      .set({ name: DEMO_ACCOUNT.name, passwordHash: hashPassword(DEMO_ACCOUNT.password) })
      .where(eq(users.id, existing.id))
      .run();
    db.update(workspaces)
      .set({ name: DEMO_ACCOUNT.workspaceName, plan: "pro" })
      .where(eq(workspaces.id, DEMO_ACCOUNT.workspaceId))
      .run();
    return DEMO_ACCOUNT.workspaceId;
  }

  db.insert(users)
    .values({
      id: DEMO_ACCOUNT.userId,
      email: DEMO_ACCOUNT.email,
      name: DEMO_ACCOUNT.name,
      passwordHash: hashPassword(DEMO_ACCOUNT.password),
      createdAt: daysAgo(90),
    })
    .run();
  db.insert(workspaces)
    .values({
      id: DEMO_ACCOUNT.workspaceId,
      name: DEMO_ACCOUNT.workspaceName,
      plan: "pro",
      createdAt: daysAgo(90),
    })
    .run();
  db.insert(workspaceMembers)
    .values({
      id: DEMO_ACCOUNT.memberId,
      workspaceId: DEMO_ACCOUNT.workspaceId,
      userId: DEMO_ACCOUNT.userId,
      role: "owner",
      createdAt: daysAgo(90),
    })
    .run();
  return DEMO_ACCOUNT.workspaceId;
}

function insertForm(
  workspaceId: string,
  id: string,
  slug: string,
  schema: FormSchemaV1,
  status: "draft" | "published" | "closed" | "archived",
  updatedAt: Date,
  createdAt: Date
) {
  const db = getDb();
  db.insert(forms)
    .values({
      id,
      workspaceId,
      title: schema.title,
      slug,
      status: status === "published" ? "draft" : status,
      draftSchema: schema,
      submissionCount: 0,
      createdAt,
      updatedAt,
    })
    .run();
  if (status === "published" || status === "closed" || status === "archived") {
    publishForm(id);
    if (status !== "published") {
      db.update(forms).set({ status }).where(eq(forms.id, id)).run();
    }
  }
}

function addDestinations(formId: string, specs: { type: "email" | "webhook" | "slack"; config: object; failing?: boolean }[]) {
  const db = getDb();
  const destRows: { id: string; type: string; failing?: boolean }[] = [];
  for (const spec of specs) {
    const id = `dest_${nanoid(8)}`;
    db.insert(destinations)
      .values({
        id,
        formId,
        type: spec.type,
        config: spec.config,
        enabled: true,
        createdAt: daysAgo(30),
      })
      .run();
    destRows.push({ id, type: spec.type, failing: spec.failing });
  }
  return destRows;
}

function addSubmissions(
  formId: string,
  versionId: string,
  count: number,
  opts: {
    statusMix?: { complete: number; flagged: number; rejected: number };
    answerBuilder?: (person: ReturnType<typeof randomPerson>, i: number) => Record<string, unknown>;
    maxDaysAgo?: number;
  }
) {
  const db = getDb();
  const mix = opts.statusMix ?? { complete: 1, flagged: 0, rejected: 0 };
  const totalWeight = mix.complete + mix.flagged + mix.rejected;
  const statuses: ("complete" | "flagged" | "rejected")[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random() * totalWeight;
    if (r < mix.complete) statuses.push("complete");
    else if (r < mix.complete + mix.flagged) statuses.push("flagged");
    else statuses.push("rejected");
  }

  const submissionIds: string[] = [];
  for (let i = 0; i < count; i++) {
    const person = randomPerson();
    const status = statuses[i] ?? "complete";
    const id = `sub_${nanoid(10)}`;
    const createdAt = daysAgo(Math.floor(Math.random() * (opts.maxDaysAgo ?? 28)), 8 + (i % 12));
    db.insert(submissions)
      .values({
        id,
        formId,
        formVersionId: versionId,
        answers: opts.answerBuilder?.(person, i) ?? { name: person.name, email: person.email },
        email: person.email,
        spamScore: status === "flagged" ? 0.82 : status === "rejected" ? 0.95 : 0.05,
        spamSignals: status === "complete" ? null : ["honeypot", "velocity"],
        status,
        sessionId: `sess_${nanoid(8)}`,
        referrer: pick(["https://google.com", "https://linkedin.com", "https://producthunt.com", null]),
        countryCode: pick(["US", "US", "GB", "DE", "CA"]),
        deviceType: pick(["desktop", "mobile", "tablet"]),
        embedSource: pick(["hosted", "embed", "framer"]),
        timeToCompleteMs: 45_000 + Math.floor(Math.random() * 120_000),
        readAt: status === "complete" && Math.random() > 0.4 ? createdAt : null,
        createdAt,
      })
      .run();
    submissionIds.push(id);
  }

  const complete = statuses.filter((s) => s === "complete").length;
  db.update(forms).set({ submissionCount: complete }).where(eq(forms.id, formId)).run();
  return submissionIds;
}

function addDeliveries(
  destId: string,
  submissionIds: string[],
  successRate: number,
  failingDetail?: string
) {
  const db = getDb();
  for (const submissionId of submissionIds) {
    const failed = Math.random() > successRate;
    db.insert(destinationDeliveries)
      .values({
        id: `dlv_${nanoid(10)}`,
        destinationId: destId,
        submissionId,
        status: failed ? (Math.random() > 0.5 ? "failed" : "retrying") : "success",
        attempts: failed ? 3 : 1,
        lastAttemptAt: daysAgo(Math.floor(Math.random() * 3)),
        errorDetail: failed ? failingDetail ?? "HTTP 502 Bad Gateway from webhook endpoint" : null,
        createdAt: daysAgo(Math.floor(Math.random() * 5)),
      })
      .run();
  }
}

function addAnalyticsEvents(formId: string, pageId: string, fieldIds: string[], sessions: number) {
  const db = getDb();
  for (let i = 0; i < sessions; i++) {
    const sessionId = `sess_an_${nanoid(6)}`;
    const createdAt = daysAgo(Math.floor(Math.random() * 25));
    db.insert(formEvents)
      .values({
        id: `evt_${nanoid(10)}`,
        formId,
        eventType: "form_view",
        sessionId,
        createdAt,
      })
      .run();
    if (Math.random() > 0.25) {
      db.insert(formEvents)
        .values({
          id: `evt_${nanoid(10)}`,
          formId,
          eventType: "form_start",
          sessionId,
          createdAt: new Date(createdAt.getTime() + 2000),
        })
        .run();
      for (const fieldId of fieldIds) {
        if (Math.random() > 0.15) {
          db.insert(formEvents)
            .values({
              id: `evt_${nanoid(10)}`,
              formId,
              eventType: "field_focus",
              fieldId,
              pageId,
              sessionId,
              createdAt: new Date(createdAt.getTime() + 5000),
            })
            .run();
          if (Math.random() > 0.7) {
            db.insert(formEvents)
              .values({
                id: `evt_${nanoid(10)}`,
                formId,
                eventType: "field_error",
                fieldId,
                pageId,
                sessionId,
                createdAt: new Date(createdAt.getTime() + 8000),
              })
              .run();
          }
        }
      }
    }
  }
}

function addApiKey(workspaceId: string) {
  const db = getDb();
  const secret = "fld_demo_" + nanoid(24);
  db.insert(apiKeys)
    .values({
      id: "key_demo_design",
      workspaceId,
      name: "Figma prototype",
      keyHash: crypto.createHash("sha256").update(secret).digest("hex"),
      prefix: secret.slice(0, 12),
      lastUsedAt: daysAgo(2),
      createdAt: daysAgo(14),
    })
    .run();
}

export function seedDemo(options: { fresh?: boolean } = {}) {
  const fresh = options.fresh !== false;
  const workspaceId = ensureDemoAccount();
  if (fresh) clearWorkspace(workspaceId);

  // --- Product waitlist (hero form) ---
  const waitlistId = "frm_demo_waitlist";
  insertForm(workspaceId, waitlistId, "product-waitlist", waitlistSchema(), "published", daysAgo(1), daysAgo(45));
  const waitlistVersion = getDb().select().from(forms).where(eq(forms.id, waitlistId)).get()!.publishedVersionId!;
  const waitlistDests = addDestinations(waitlistId, [
    { type: "email", config: { to: "growth@acme.test" } },
    { type: "slack", config: { webhookUrl: "https://hooks.slack.com/demo" } },
    { type: "webhook", config: { url: "https://api.acme.test/hooks/waitlist" }, failing: true },
  ]);
  const waitlistSubs = addSubmissions(waitlistId, waitlistVersion, 142, {
    maxDaysAgo: 30,
    statusMix: { complete: 0.88, flagged: 0.08, rejected: 0.04 },
    answerBuilder: (p) => ({
      name: p.name,
      email: p.email,
      company: p.company,
      role: pick(["founder", "product", "engineering", "marketing"]),
      use_case: [pick(["leads", "feedback", "ops", "events"])],
    }),
  });
  const webhookDest = waitlistDests.find((d) => d.failing)!;
  addDeliveries(webhookDest.id, waitlistSubs.slice(0, 18), 0.35, "Connection timeout to api.acme.test:443");
  addAnalyticsEvents(waitlistId, "page_1", ["name", "email", "company", "role", "use_case"], 420);

  // --- Enterprise demo ---
  const enterpriseId = "frm_demo_enterprise";
  insertForm(
    workspaceId,
    enterpriseId,
    "enterprise-demo",
    contactSchema("Enterprise demo request"),
    "published",
    daysAgo(3),
    daysAgo(60)
  );
  const enterpriseVersion = getDb().select().from(forms).where(eq(forms.id, enterpriseId)).get()!.publishedVersionId!;
  addDestinations(enterpriseId, [
    { type: "email", config: { to: "sales@acme.test" } },
    { type: "webhook", config: { url: "https://crm.acme.test/leads" } },
  ]);
  addSubmissions(enterpriseId, enterpriseVersion, 38, {
    maxDaysAgo: 21,
    answerBuilder: (p) => ({
      name: p.name,
      email: p.email,
      company_size: pick(["11-50", "51-200", "200+"]),
      message: `We're evaluating form tools for ${p.company}. Need SSO and audit logs.`,
    }),
  });
  addAnalyticsEvents(enterpriseId, "page_1", ["name", "email", "company_size", "message"], 180);

  // --- Customer feedback (spam folder content) ---
  const feedbackId = "frm_demo_feedback";
  insertForm(workspaceId, feedbackId, "customer-feedback", feedbackSchema(), "published", daysAgo(2), daysAgo(30));
  const feedbackVersion = getDb().select().from(forms).where(eq(forms.id, feedbackId)).get()!.publishedVersionId!;
  addDestinations(feedbackId, [{ type: "email", config: { to: "feedback@acme.test" } }]);
  addSubmissions(feedbackId, feedbackVersion, 56, {
    maxDaysAgo: 14,
    statusMix: { complete: 0.75, flagged: 0.2, rejected: 0.05 },
    answerBuilder: (p, i) => ({
      email: p.email,
      rating: 3 + (i % 3),
      feature: pick(["builder", "inbox", "analytics", "api"]),
      comments: pick([
        "Love the inbox view.",
        "Analytics could show drop-off by page.",
        "Would like Notion destination.",
        "Fast setup — shipped in a day.",
      ]),
    }),
  });
  addAnalyticsEvents(feedbackId, "page_1", ["email", "rating", "feature", "comments"], 95);

  // --- Event registration ---
  const eventId = "frm_demo_event";
  insertForm(
    workspaceId,
    eventId,
    "fieldo-launch-webinar",
    {
      ...contactSchema("Fieldo launch webinar"),
      title: "Fieldo launch webinar",
      pages: [
        {
          id: "page_1",
          fields: [
            { id: "name", type: "text", label: "Full name", required: true },
            { id: "email", type: "email", label: "Email", required: true },
            { id: "company", type: "text", label: "Company" },
            {
              id: "attendance",
              type: "radio",
              label: "Will you attend live?",
              options: [
                { label: "Yes", value: "yes" },
                { label: "Send recording", value: "recording" },
              ],
            },
          ],
        },
      ],
    },
    "published",
    daysAgo(5),
    daysAgo(20)
  );
  const eventVersion = getDb().select().from(forms).where(eq(forms.id, eventId)).get()!.publishedVersionId!;
  addSubmissions(eventId, eventVersion, 24, {
    maxDaysAgo: 10,
    answerBuilder: (p) => ({
      name: p.name,
      email: p.email,
      company: p.company,
      attendance: pick(["yes", "recording"]),
    }),
  });

  // --- Stale draft (attention queue) ---
  insertForm(
    workspaceId,
    "frm_demo_partner",
    "partner-intake-draft",
    contactSchema("Partner intake"),
    "draft",
    daysAgo(18),
    daysAgo(40)
  );

  // --- Blank-ish draft for builder screens ---
  insertForm(
    workspaceId,
    "frm_demo_untitled",
    "untitled-campaign",
    {
      schemaVersion: 1,
      title: "Untitled campaign",
      pages: [{ id: "page_1", fields: [] }],
      logic: [],
      theme: {},
      settings: {},
    },
    "draft",
    daysAgo(0),
    daysAgo(1)
  );

  addApiKey(workspaceId);

  return {
    workspaceId,
    forms: {
      waitlist: waitlistId,
      enterprise: enterpriseId,
      feedback: feedbackId,
      event: eventId,
      partnerDraft: "frm_demo_partner",
      untitled: "frm_demo_untitled",
    },
  };
}
