# Fieldo — Full Product Requirements Document
**Working name:** Fieldo (final name TBD — `fieldo.io` available)
**Version:** 2.0 — Research-corrected final
**Date:** June 12, 2026
**Author:** Solo founder

---

## 0. Research Corrections vs. v1 Draft

Before everything else, these are facts verified against primary sources on June 12, 2026 that change the plan:

### 0.1 Competitive corrections

**FramerForms pricing has changed** (verified June 12 from framerforms.com/pricing):
- Basic: $79 (was $99), Pro: $119 (was $179), Commercial: $189 (was $399)
- Calculators & Quizzes add-on: $119 separately (requires Basic+)
- reCAPTCHA is now **Commercial-only** ($189 tier) — not available at $79/$119
- FramerForms has **no MCP**, **no inbox**, **no analytics**, **no hosted link**, **no backend of its own** — confirmed unchanged
- They do have **Enterprise and Custom Builds tiers** now — a signal they're moving upmarket/agency

**Tally analytics situation — critical update to claims:**
- Tally **does** have drop-off analytics (Pro $29/mo, annual ~$24/mo)
- "Field-level drop-off" is documented as a Tally Pro feature
- However: Tally's analytics is *page/step-level*, not *true field-level* (time-per-field, refocus rate, error rate, dwell time are NOT in Tally)
- Tally also has **MCP server** (~21 tools, OAuth, free tier) — launched early 2026
- Fieldo's claim must shift from "no competitor has drop-off" to "no competitor has **field-level** analytics (time-per-field, error rate, dwell, AI insights)"

**MCP landscape is now crowded — requires sharper positioning:**
- Tally: ~21 MCP tools, OAuth, free, stable. Create/edit/read submissions + built-in analysis prompts
- Jotform: 5 MCP tools, OAuth, paid plan needed. Basic create/edit/read
- Typeform: MCP beta, personal access token only (not OAuth), limited
- Stigmi: native MCP, create + analyse
- **None of these have:** Framer component + native rendering + field-level analytics + form-infrastructure focus for the Framer ecosystem
- Our MCP differentiation must be "**forms infrastructure agent for Framer builders**" not just "has MCP"

**Proofly is bigger and faster-moving than originally assessed:**
- Proofly is now **6 plugins** in one account: PageLock, Proofly Forms (builder, in progress), Forms Inbox, React Export, MCP, ThemeShift
- 1,600+ Framer users confirmed (not 200-odd as estimated)
- Proofly Forms Inbox pricing: Free (50 subs), Pro $25/mo (full Proofly suite)
- **Proofly is building a form builder** ("webhook inbox for any Framer form, with a form-builder plugin on the way") — they confirmed this publicly
- This is now the most dangerous direct competitor. Their moat is breadth (6 plugins, 1 account); ours is depth (one integrated forms-infrastructure product with analytics + agent surface)

**Framer native — confirmed gaps as of June 2026:**
- Antispam: shipped June 5, 2026 (Basic free rule-based, Advanced AI = Pro+ only)
- Still **no**: multi-step, conditional logic, file uploads, **inbox**, analytics, partial capture
- Submissions go to email / Google Sheets / webhook — **no owned inbox**, confirmed

**Tally partial submissions clarification:**
- Tally partial submissions = "capture unfinished responses before submit" (Pro, iframe only)
- Also has "pre-fill fields with data you already have" (separate feature)
- Neither = Framer-native abandonment capture with email-on-blur

### 0.2 What this means for the moat

Original 4-part moat holds, but requires sharper language:

| Claim | Status after research |
|---|---|
| "No competitor has drop-off analytics" | ❌ Too broad — Tally has page-level drop-off at Pro |
| "No competitor has field-level analytics" | ✅ Still true — time-per-field, dwell, refocus, error rate, AI insights exist nowhere |
| "No competitor has MCP" | ❌ False — Tally, Jotform, Typeform, Stigmi all have MCP |
| "No Framer-native MCP for forms data" | ✅ True — Proofly MCP is canvas-only, not forms-data/submissions |
| "No inbox anywhere in the Framer ecosystem" | ✅ Still true — Proofly Inbox exists but is a retrofit, not an integrated builder+backend |
| "Proofly has 24 users" | ❌ They have 1,600+ Framer users across all plugins |
| "Spam stack = headline wedge" | ❌ Framer now has native antispam — confirmed wedge is reviewable spam folder + free at every tier |

**Revised moat statement:**
> "The only Framer-native form tool that owns your submissions data with a searchable inbox, measures *field-level* conversion (time, dwell, error, AI insight — not page counts), and lets AI agents operate your full forms infrastructure — while rendering natively in Framer's design system, not in an iframe."

---

## 1. Problem

Framer builders have exactly two options for forms in 2026:

**Option A — Native Framer forms:** Beautiful rendering, zero data ownership. Submissions email/sheet and disappear. No multi-step, no logic, no file uploads, no inbox, no analytics.

**Option B — Plugins (FramerForms, Framer Geeks) or embeds (Tally/Typeform):** Either a powerful Framer-plugin-only frontend with no backend whatsoever, or a backend-owning iframe that breaks your design system and kills token inheritance.

The result: **every Framer builder is a data tenant, not a data owner.** They send their leads somewhere else and hope. They have no visibility into where visitors drop off on individual questions. They can't give an AI agent access to their forms infrastructure. And when Framer's native antispam misfires, there's no folder to check — it just silently blocks or passes.

This is a solved problem in the generic SaaS world (Typeform, Jotform) but nobody in the Framer ecosystem has solved it with native rendering. That's the gap.

---

## 2. Solution

**Fieldo** = a form infrastructure platform built for Framer builders and the AI agents they use:

1. **Native rendering** — a real Framer Marketplace component (no iframe) that inherits your design tokens
2. **Owned backend** — a searchable inbox where every submission lives; your data, your export, forever
3. **Field-level analytics** — drop-off curve per field (not page), time-per-field, dwell, error rate, AI friction insights
4. **Forms-infrastructure MCP** — 28 tools so Claude/Cursor/Claude Code can create a form, publish it, query submissions, and act on analytics without touching a UI

One schema. One inbox. Five surfaces: Framer component, hosted link, iframe embed, HTML script, npm React package.

---

## 3. Market & Timing

**Why now:**
- Framer's form ecosystem is fragmented — native is weak, plugins have no backend, inbox is a retrofit
- MCP adoption is real (Tally/Jotform shipped MCP in early 2026) but none are Framer-native
- "AI operates your tools" is the new expectation; forms infrastructure is still manual
- Proofly is building a form builder — window to launch an integrated product is 3-6 months

**Addressable market:**
- ~500k active Framer projects (Framer's public metric)
- Target: builders who publish sites for clients or products and collect leads/signups (est. 120-200k workspaces)
- Near-term reachable: Framer Marketplace installs (comparable plugin at 10k installs in 18 months)

**Revenue model:** Subscription ($15/39/mo) + Founding lifetime bridge (first 150 seats at $129)

---

## 4. Competitive Landscape (Verified June 12, 2026)

### 4.1 Direct competitors in the Framer ecosystem

| Tool | Type | Backend | Inbox | Field Analytics | MCP | Hosted Link | Price |
|---|---|---|---|---|---|---|---|
| **Fieldo** | Builder + backend | ✅ owned | ✅ | ✅ field-level + AI | ✅ forms-infra | ✅ | $0/$15/$39/mo |
| Framer Native | Native | ❌ (email/sheets) | ❌ | ❌ | ❌ | ❌ | Framer plan |
| FramerForms | Plugin (Framer-only) | ❌ rides Framer | ❌ | ❌ | ❌ | ❌ | $79/$119/$189 lifetime |
| Framer Geeks | Plugin | ❌ | ❌ delivery status only | ❌ | ❌ | ❌ | free |
| Proofly Inbox | Inbox retrofit | ✅ (inbox only) | ✅ basic | ❌ | ❌ | ❌ | Free/$25/mo (suite) |
| Proofly Forms | Builder (in progress) | TBD | TBD | ❌ planned | ❌ | ❌ | TBD |
| Framer Form Kit | Components only | ❌ | ❌ | ❌ | ❌ | ❌ | Free |

### 4.2 Generic form builders (indirect)

| Tool | MCP | Native Framer | Field-level analytics | Partial capture | Inbox | Price |
|---|---|---|---|---|---|---|
| Tally | ✅ ~21 tools | ❌ iframe | ❌ page drop-off only | ✅ Pro | ✅ | Free/$29/mo |
| Jotform | ✅ 5 tools | ❌ iframe | ❌ | ✅ | ✅ | Free (tight)/$34/mo |
| Typeform | ✅ beta | ❌ iframe | Completion rate only | ❌ | ✅ | $29+/mo |
| Stigmi | ✅ native MCP | ❌ iframe | ❌ | ❌ | ✅ | — |
| HubSpot | ❌ | ❌ iframe | ❌ | ✅ | ✅ | Free/paid CRM |

**The gap nobody fills:** Native Framer rendering + owned inbox + **field-level** analytics (true per-field, not page) + forms-infrastructure MCP (not canvas MCP). This combination does not exist.

### 4.3 Threat matrix

| Threat | Probability | Timeline | Response |
|---|---|---|---|
| Proofly ships form builder with inbox + analytics | High | 2-4 months | Ship integrated product before they complete the stack; their pieces will always be disconnected retrofits unless they rebuild from scratch |
| Framer ships native inbox | Medium | 6-12 months | Analytics + MCP + universal embeds are Framer-independent legs; graceful degrade to "Tally with native rendering + agent API" |
| Tally adds Framer component | Low | 12+ months | Their architecture (iframe SaaS) makes native rendering a rewrite; not in their incentive set |
| FramerForms adds backend | Low | 6-12 months | 10k lifetime users makes metered pricing painful re-transition; speed + analytics + MCP |

---

## 5. Product Requirements

### 5.1 Core Principles

1. **One schema everywhere.** `FormSchemaV1` is the single contract between builder, AI engine, renderer, and server. Never two validators.
2. **You own your data.** Inbox is free forever. Submissions never disappear unless you delete them.
3. **Field is the unit, not the page.** All analytics, logic, and partial capture operate at the field level.
4. **Agent-first, not agent-added.** MCP isn't an integration; it's a first-class surface with the same capability as the dashboard.
5. **Render native, embed universal.** Same form works as a Framer component, hosted link, iframe, HTML script, and npm package.

### 5.2 Form Schema (FormSchemaV1)

The single source of truth — used by builder, AI generator, renderer, and server validator.

**Structure:**
```
FormSchemaV1
  id, workspaceId, title, slug
  pages: Page[]
    Page: { id, title?, fields: FieldDef[] }
  logic: LogicRule[]
  theme: ThemeTokens
  settings: FormSettings
  schemaVersion: int
```

**FieldDef (v1 types — 15 required for launch):**
- Input: `text`, `textarea`, `email`, `phone`, `url`, `number`, `password`
- Selection: `select`, `radio`, `checkbox`, `multi-select`
- Specialized: `date`, `rating`, `file`, `hidden` (UTM/referrer), `otp`, `statement`
- Deferred to v2: `payment`, `signature`, `matrix`, `ranking`, `audio`

Each field has: immutable nanoid `id`, type, label, placeholder, help text, required flag, type-specific `validation`, `options` (for selection types), `meta` (order, width, conditional-visible), `pageId`.

**Logic engine (`evaluateLogic()` in `form-core`):**
```
when { all | any: [ { fieldId, op, value } ] }
→ then: [ show | hide | jumpTo | setRequired ]
```
Runs client-side on change (UX). Runs server-side on submit (security — hidden fields cannot be injected). AND/OR groups ship in v1.1.

**Theme tokens:**
CSS variables only — no CSS-in-JS runtime. Tokens: `fontFamily` (+ `inherit` for Framer host-page fonts), primary color, background, border, radius, spacing scale, label style, button style, progress bar style. Emitted as `--fieldo-*` CSS vars.

**Settings:**
- Submit behavior: message or redirect URL
- Notifications: owner email, auto-responder (to submitter)
- Spam: honeypot, min-seconds-to-submit, optional Turnstile, score threshold, flag vs reject
- Limits: maxResponses, openAt, closeAt, password protection
- Partials: enabled/disabled, email-on-blur capture
- Privacy: public, unlisted, password-protected
- allowedOrigins: CORS whitelist for embed targets

**Versioning:**
- Draft mutates freely in the builder
- Publish = snapshot into immutable `form_versions` table + repoint `forms.published_version_id`
- Rollback = repoint to any prior version (instant)
- Submissions pin `form_version_id`
- `schemaVersion` int on the meta endpoint for forward-compatibility: unknown field types → skip + warn, never crash

### 5.3 Features — v1 Scope

#### 5.3.1 Form Builder (Dashboard)

**Visual builder:**
- Zustand draft store of `FormSchemaV1` + snapshot undo (cmd+z) + debounced autosave
- FieldPalette: type-registry-driven, drag-to-canvas
- BuilderCanvas: uses the actual `<FormRenderer>` in `mode="preview"` — what you see IS what renders (structural WYSIWYG, not a mock)
- FieldInspector: label, placeholder, validation, options, logic
- LogicEditor: visual when/then rules + cycle detection lint
- ThemeEditor: live CSS var preview
- PageManager: add/reorder pages (multi-step)
- PreviewPane: side-by-side preview
- PublishBar: diff indicator vs published version + publish button

**AI Form Generator (same engine as MCP `create_form`):**
- Input: natural language description, URL (scrape + infer fields), or uploaded PDF
- Output: validated `FormSchemaV1` merged into draft
- "AI and hands share one artifact" — no separate AI-only flow

**AI Question Suggestions (sidebar panel):**
- Suggest missing fields based on form purpose
- Detect duplicate/redundant questions
- Recommend field type upgrades (text → email, select → radio based on option count)

**Form Migration:**
- Paste a competitor form URL → scrape + convert to Fieldo schema
- Targets: Typeform, Tally, Google Forms public URLs
- Ships as Lab feature (best-effort, not guaranteed)

**Theme Marketplace (v1.1):**
- Community-installable themes: Apple-inspired, Stripe-inspired, Linear-inspired, Notion-inspired, Minimal SaaS
- Install = copy theme tokens into workspace theme library

#### 5.3.2 Submissions Inbox

The core wedge. Free forever at every tier.

**Features:**
- All submissions in one searchable, filterable list
- Read/unread state
- Spam folder (flagged submissions, never silently deleted — reviewable and recoverable)
- Full submission detail view: all fields, metadata (country, device, referrer, embed source, time-to-complete)
- Bulk actions: mark read, export selected, delete
- CSV export (all or filtered)
- Email notification on new submission (customizable template)
- Auto-responder to submitter (Pro)
- Lead routing rules — route to different email/webhook based on field values (Business)

**Submission record includes:**
- All answers, form version pinned, session ID, spam score + signals, status (complete/flagged/rejected), referrer, country (via IP), device/browser, embed_source (framer|hosted|iframe|react|html), time_to_complete_ms, read_at

#### 5.3.3 Field-Level Analytics

**The industry-first moat.** No competitor at any price has true field-level analytics.

**Metrics per field:**
- Reach rate (% of openers who reached this field)
- Completion rate (% of openers who filled and moved past)
- Drop-off rate (% who abandoned at this field specifically)
- Median dwell time (seconds spent in the field)
- Refocus count (avg. times user returned to fix this field)
- Error rate (% of focus events that triggered a validation error)
- Skip rate (optional fields only — % left blank)

**Form-level metrics:**
- Views → starts → completions funnel
- Conversion rate, completion rate, avg. time-to-complete
- Segment by: embed_source (Framer vs hosted vs HTML), device, country, referrer
- Submission volume by day/week/month

**AI Friction Insights (Groq pipeline, aggregates only — no raw PII sent):**
- Surfaces the single highest-impact field for completion improvement
- Example outputs: "Field 4 'Company size' causes 40% drop. Make optional or move to page 2." / "'Project description' textarea has 3× avg refocus — add a character counter or example text."
- Cached in `forms.ai_insights`, refreshed on background job after each 50-submission batch
- One-click "Apply suggestion" in builder (moves field, changes required state)

**A/B testing (v1.1):**
- Compare form version A vs B on split traffic
- Auto-pick winner by completion rate after statistical significance

**Experiments (v2):**
- Test individual field labels/types
- Multi-variant field experiments

#### 5.3.4 Spam Stack

Free at every tier — this is a promise, not a feature gate.

**Layers (cumulative scoring):**
1. Honeypot field (hidden, bot-filled = +1.0 score)
2. Server-issued signed render-timestamp token from `/meta` endpoint — time-trap: submit too fast = +0.6
3. Disposable email domain list (updated weekly) = +0.3
4. Link count + keyword heuristics (SEO spam patterns) = +0.2
5. Optional Cloudflare Turnstile (BYO key or Fieldo's) = +1.0 if fails
6. IP rate limiting (Redis sliding window, per IP+form)

**Score thresholds (configurable per form):**
- < 0.5 = pass
- 0.5-0.9 = flag (goes to spam folder, owner can review + recover)
- ≥ 1.0 = silent reject (200 response, status=rejected in DB — bots learn nothing)

**Key differentiation vs Framer native antispam:** reviewable spam folder. When Framer's Advanced AI antispam misfires (and it will), legitimate submissions are gone. Fieldo's spam folder lets owners recover false positives. This is free at every tier.

#### 5.3.5 Partial Capture & Abandonment

**How it works:**
- On each field `blur` event, answers are beaconed to the partials endpoint
- Also triggered on `visibilitychange` (tab switch/close)
- Stored in `partial_submissions` keyed by (form_id, session_id), last-write-wins
- Email captured on blur when the email field is reached — **the goldmine**: you know who abandoned before they submitted
- Resume token stored in localStorage; if visitor returns, answers are pre-filled

**Analytics tie-in:** Abandonment events feed field-level drop-off analytics. You see exactly which field caused the abandonment, not just that someone left.

**UI (Pro tier — v1.1):** Partial submissions inbox tab. Filter by "has email" (recoverable leads). One-click "send resume link" to re-engage.

#### 5.3.6 Framer Component (`FieldoForm.tsx`)

**Installation:** Framer Marketplace component (submitted week 8 of build)

**Props:**
- `formId` (required) — the published form ID
- `apiBaseUrl` (advanced, hidden by default) — for self-hosted or staging
- `useDashboardTheme` (toggle) — inherit dashboard theme vs override with Framer panel controls

**Framer panel controls (when `useDashboardTheme` = false):**
- Per-token overrides: primary color, font family, border radius, spacing
- Dashboard theme = source of truth; panel = instance-level override

**Canvas behavior:**
- `RenderTarget.canvas` → renders a static structural skeleton (field labels and inputs, no live data, no tracking). Respects Framer's canvas performance constraints.
- Published site → hydrates `<FormRenderer>` with live schema from `/meta` endpoint

**Technical:**
- esbuild-inline `renderer` + `form-core` packages into dist
- Target bundle size: < 150KB gzipped
- No iframe. Real DOM nodes in the Framer component tree.
- Font inheritance: `fontFamily: inherit` CSS token picks up host page fonts from Framer's CSS cascade

**Schema version negotiation:**
- Component sends `?supportedSchema=1` on the meta request
- Server down-compiles schema if needed (v1: skips unknown field types with console warning)
- Prevents breakage when Fieldo ships new field types while old component versions are installed

#### 5.3.7 Hosted Link & Universal Embeds

**Hosted page (`/f/[formId]`):**
- SSR the published form version
- Custom OG tags + AI-generated OG image (form title + brand colors)
- Privacy gate if password-protected
- `?embed=1` strips chrome, enables postMessage auto-height for iframe targets

**Five embed targets (generated by `generate_embed_code` MCP tool and dashboard):**
1. **Framer component** — JSON property + Marketplace URL
2. **Hosted link** — URL for sharing or linking
3. **iFrame** — standard `<iframe src="/f/[id]?embed=1">` with auto-height script
4. **HTML script** (`embed.js`) — no-iframe DOM render; injects form directly into host page; inherits host page fonts and CSS variables; `<script src="https://fieldo.io/embed.js" data-form="[id]"></script>`
5. **React / Next.js** — npm `@fieldo/react` package with `<FieldoForm id="[id]" />` component; zero-install self-contained variant also available

All five surfaces share one schema, one inbox, one analytics pipeline. `embed_source` field on events and submissions segments data by surface.

#### 5.3.8 MCP Server (Agent API)

28 tools, OAuth 2.0, remote hosted endpoint at `https://mcp.fieldo.io`.

**Scopes:** `forms:read`, `forms:write`, `forms:delete`, `submissions:read`, `submissions:write`, `analytics:read`, `developer:read`

**Tool groups:**

*Library (read):*
- `list_workspaces`, `list_folders`, `list_forms` (filter by status/search), `get_form` (schema + stats), `search_forms`

*Management (write-guarded):*
- `create_form` — accepts JSON schema OR natural-language description (server runs AI → validated schema)
- `update_form_fields`, `add_field`, `remove_field`
- `set_logic` — server lints for cycles before saving
- `update_form_settings`, `update_form_theme`
- `publish_form`, `unpublish_form`, `duplicate_form`
- `delete_form` — requires `confirm: true` argument

*Submissions:*
- `get_submissions` (filter by status, date, search), `get_submission`
- `export_submissions` → signed download URL (CSV/JSON)
- `get_partial_submissions`
- `mark_submission` (read/spam/unspam/delete)
- `delete_submission` — requires `confirm: true`

*Analytics:*
- `get_form_analytics` — top-level conversion metrics
- `get_field_funnel` — per-field drop-off curve
- `get_friction_insights` — AI recommendations for the form
- `get_workspace_analytics` — across all forms

*Developer:*
- `get_form_api` — schema, endpoint URLs, CORS config
- `generate_embed_code` — all 5 targets
- `scaffold_form_integration` — boilerplate code snippet for a given target
- `test_submit` — submits a test payload (flagged test, excluded from real analytics and fan-out)
- `get_form_status` — published/draft/closed, submission count, limits

**Headline MCP recipe (3 calls from Claude to a live form with real submissions):**
```
create_form("contact form for SaaS landing page, asks name, work email, company size")
→ publish_form({ id })
→ generate_embed_code({ id, target: "framer" })
```

**MCP differentiation from Tally/Jotform:** Those tools let agents manage forms in their own SaaS. Fieldo's MCP lets agents operate the *entire forms infrastructure for a Framer builder* — create forms that render natively in their design system, query field-level analytics, route submissions, and work with abandonment data. The agent layer is forms-infrastructure, not forms-dashboard-access.

#### 5.3.9 Submission Pipeline (Server)

`POST /api/v1/forms/{id}/submit`, CORS per `allowedOrigins`.

1. Load published version → 404 (not found) / 410 (closed + closed message + submission count check / closeAt)
2. Redis sliding-window rate limit (per IP+form, per form globally)
3. Spam scoring: honeypot → render-timestamp token → disposable email → keyword heuristics → optional Turnstile. Accumulate score. Reject = silent 200 + status=rejected.
4. Server re-validation (logic-aware): re-run `evaluateLogic()` server-side, strip hidden field answers, exempt hidden required fields, return 422 with field errors if invalid
5. Verify file upload refs (must have been pre-uploaded via presigned URL flow)
6. Dedupe check: optional unique-by-email → 409 if duplicate
7. Insert submission + increment counter + delete matching partial
8. Enqueue `submission.fanout` job (worker): owner email via Resend → auto-responder → HMAC-signed webhook (with retry + exponential backoff) → Slack webhook → Google Sheets append (v1.1 native; Zapier/Make ride the webhook in v1)
9. Return `{ submissionId, behavior, behaviorData }`

**File uploads:** `POST /api/v1/forms/{id}/uploads` → presigned R2 PUT URL (plan-gated size cap). Orphaned pre-submit file refs GC'd at 24h.

**Partials:** Debounced 2s + visibilitychange → `POST/PATCH /api/v1/forms/{id}/partials` (upsert by session_id). Resume token in response, stored in localStorage.

#### 5.3.10 Integrations

**v1 (at launch):**
- Owner email notifications (Resend)
- Auto-responder to submitter (Pro)
- Webhook (HMAC-signed, retry queue)
- CSV export
- Zapier/Make via webhook (no native node required)

**v1.1 (post-launch fast-follows):**
- Native Google Sheets (replace Framer's own sheets integration — own the destination)
- Native Slack (submission notifications)
- Native Notion database append

**v2:**
- HubSpot, Brevo, Mailchimp (direct CRM/marketing platform push)
- Airtable
- Salesforce (Business tier)

#### 5.3.11 Additional Features (Scoped)

**PWA + Notifications (v1.1):**
- Dashboard is a PWA (installable)
- Push notifications for new submissions on mobile

**Audio Responses (v2):**
- Voice note field type — record on mobile, transcribed + stored
- AI summary of audio responses in analytics view

**File Review AI (v2):**
- Uploaded PDFs/images in submissions: AI-generated summary in the inbox detail view

**E-signature (v2):**
- Legal e-signature field type (via a signing service or custom canvas)

**Payments (v2):**
- Stripe-connected payment field
- Checkout forms with form + payment in one step
- Intentionally deferred — concede to FramerForms Calculators/Quizzes in v1; different job

**QR Code (v1.1):**
- Every hosted form URL auto-generates a downloadable QR code
- Available in the dashboard share panel

**OTP / Phone Verification (v1.1):**
- OTP field with SMS verification (Twilio or similar)

---

## 6. Database Schema

Built on Postgres + Drizzle ORM. UUID PKs, workspace-cascade deletes.

### Porting from FrameVid
These tables copy verbatim from FrameVid:
- `users`, `workspaces`, `workspace_members`, `workspace_invites`, `api_keys`, `oauth_clients`, `folders`

These are templates (pattern-copy, rename):
- `leads` → `submissions`
- `videoEvents` → `form_events`

### New tables

**`forms`**
```
id, workspace_id, folder_id?, title, slug (short public id, unique),
status (draft|published|closed|archived),
draft_schema jsonb,
published_version_id (FK → form_versions, nullable),
submission_count (denormalized counter),
ai_insights jsonb (cached, nullable),
created_by, created_at, updated_at
```
Index: (workspace_id, status), (slug)

**`form_versions`**
```
id, form_id, version (int, unique per form),
schema jsonb, schema_version int,
published_by, published_at
```
Immutable after insert.

**`submissions`**
```
id, form_id, form_version_id,
answers jsonb ({ fieldId: value }),
email (denormalized from answers, indexed — for search + dedupe + partial recovery),
spam_score float, spam_signals jsonb,
status (complete|flagged|rejected),
dedupe_key (sha256, nullable, unique per form when enabled),
session_id,
referrer, country_code, device_type, user_agent,
embed_source (framer|hosted|iframe|react|html),
time_to_complete_ms,
read_at (nullable — inbox unread tracking),
created_at
```
Index: (form_id, created_at DESC), (form_id, status), (form_id, email)

**`submission_files`**
```
id, submission_id (nullable — null = pre-submit, GC at 24h),
form_id, field_id,
storage_key (R2), file_name, mime_type, size_bytes,
created_at
```

**`partial_submissions`**
```
id, form_id, session_id, UNIQUE(form_id, session_id),
answers jsonb (last-write-wins),
email (denormalized, nullable),
last_field_id,
resume_token (uuid, indexed),
expires_at (30d TTL),
created_at, updated_at
```

**`form_events`**
```
id, form_id, event_type (enum below), field_id?, page_id?,
session_id, duration_ms?,
device_type, country_code, referrer,
embed_source (framer|hosted|iframe|react|html),
meta jsonb,
created_at
```
Event types: `form_view`, `form_start`, `field_focus`, `field_blur`, `field_error`, `field_change`, `page_next`, `page_back`, `form_abandon`, `submit_attempt`, `submit_success`, `submit_error`
Partitioned by month. Daily aggregate rollup jobs. ClickHouse migration path when volume demands.

**`destinations`** (fan-out targets)
```
id, form_id, type (email|webhook|slack|google_sheets|notion),
config jsonb (encrypted secrets),
enabled bool, created_at
```

**`destination_deliveries`** (audit + retry)
```
id, destination_id, submission_id,
status (pending|success|failed|retrying),
attempts int, last_attempt_at,
error_detail text, created_at
```

---

## 7. System Architecture

### 7.1 Monorepo structure (pnpm + turbo)

```
fieldo/
  apps/
    dashboard/          # Next.js 14 app router
    component/          # Framer Marketplace component (FieldoForm.tsx)
    worker/             # BullMQ background jobs
  packages/
    types/              # Shared TypeScript types (FormSchemaV1, etc.)
    db/                 # Drizzle schema + migrations + query helpers
    form-core/          # Pure validation + logic engine (no React, no DOM)
    renderer/           # React FormRenderer (consumed by all surfaces)
    queue/              # BullMQ queue definitions
    config/             # Shared ESLint, TS, environment configs
```

### 7.2 Technology stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Port from FrameVid |
| Database | PostgreSQL + Drizzle | UUID PKs, workspace cascade |
| Cache / queues | Redis + BullMQ | Redis rate limiting from day 1 (FrameVid weakness fixed) |
| Object storage | Cloudflare R2 | File uploads, export storage |
| Auth | Auth.js (NextAuth) | Port from FrameVid; OAuth 2.0 for MCP |
| Email | Resend | Owner notifications, auto-responder |
| AI (insights) | Groq (aggregates only, never raw PII) | Friction insight pipeline |
| AI (form gen) | Anthropic claude-sonnet-4-6 | create_form schema generation |
| Spam | Cloudflare Turnstile (optional) | BYO key or Fieldo's shared key |
| CDN / DNS | Cloudflare | Also R2, Turnstile |
| Component bundler | esbuild | Inline renderer+core, < 150KB |
| State (builder) | Zustand | Draft store + undo |

### 7.3 Renderer architecture

`form-core` (zero React, zero DOM):
- Zod schemas for `FormSchemaV1` and all field types
- `validateSubmission(schema, answers)` → field errors map
- `evaluateLogic(rules, answers)` → visible field set
- Theme typing
- Event type constants

`renderer` (React):
- `<FormRenderer schema theme onSubmit apiBaseUrl mode="live|preview|canvas" />`
- Handles: field rendering per type, paging, logic subscription (re-runs `evaluateLogic` on each change), inline validation, sendBeacon analytics, honeypot + time-trap, presigned file upload flow
- Consumed by: Framer component, `/f/[formId]` hosted page, `embed.js`, `@fieldo/react` npm package

**Single renderer — never two implementations.** All surfaces use the same component tree. CSS variables handle theming. No CSS-in-JS.

### 7.4 API surface (v1)

```
Public (CORS-gated):
  GET  /api/v1/forms/{id}/meta          # Published schema + theme + signed render token; CDN 60s SWR
  POST /api/v1/forms/{id}/submit        # Submission pipeline
  POST /api/v1/forms/{id}/uploads       # Presigned R2 PUT URL
  POST /api/v1/forms/{id}/partials      # Upsert partial
  GET  /api/v1/forms/{id}/partials/{token}  # Resume partial (prefill)
  POST /api/v1/events                   # Beacon ingestion (batched)

Hosted:
  GET  /f/{slug}                        # SSR hosted page
  GET  /embed.js                        # HTML script embed

Internal (JWT-gated, workspace-scoped):
  CRUD /api/forms                       # Form management
       /api/forms/{id}/versions         # Version history
       /api/forms/{id}/submissions      # Inbox
       /api/forms/{id}/analytics        # Field funnel, insights
       /api/forms/{id}/destinations     # Fan-out config

  Auth/OAuth (ported):
       /api/auth/**                     # Auth.js
       /oauth/**                        # OAuth 2.0 for MCP
       /.well-known/**                  # OIDC discovery

  MCP:
       /mcp                             # Streamable HTTP MCP transport
       /sse                             # SSE MCP transport (fallback)
```

---

## 8. Build Plan — 12 Weeks

### Phase 0 — Core Infrastructure (Weeks 1-2)

**Goal:** Form schema + validation + submission pipeline + hosted page. Demo: API → hosted link → submission in DB.

Tasks:
- Day 1: Create fresh repo, port auth/workspaces/RBAC/API keys/OAuth stack from FrameVid verbatim
- Port db schema (generic tables), queue bootstrap, worker deploy story
- Implement `form-core` package: FormSchemaV1 zod schemas, `validateSubmission`, `evaluateLogic`
- Implement `packages/types`: all TypeScript types
- New DB tables: forms, form_versions, submissions, submission_files, partial_submissions, form_events, destinations, destination_deliveries
- Build `renderer` package: `<FormRenderer>` with all 15 v1 field types
- Build `/api/v1/forms/{id}/meta` + `/submit` pipeline (full spam stack, rate limiting)
- Build `/f/[formId]` hosted page (SSR + hydrate renderer)
- Build basic dashboard: workspace setup, create form (raw JSON for now), view submissions list

**Verification:** `curl` create → publish → submit; submission row in DB with version pinned; logic-hidden field injection rejected server-side; honeypot silent reject.

**FrameVid unlock:** auth/workspaces/RBAC ported day 1; MCP framework, leads plumbing, events route.

### Phase 1 — Inbox + MCP (Weeks 3-4)

**Goal:** Inbox UI, notifications, webhook, CSV; MCP with OAuth + core tools + AI form generation. Demo: 90-second Claude Code video — `create_form → publish_form → generate_embed_code` → real submission → inbox live.

Tasks:
- Build inbox UI: list view, read/unread, spam folder, detail view, search/filter, bulk actions
- Owner email notification (Resend), auto-responder template
- HMAC-signed webhook + BullMQ retry queue + delivery audit
- CSV export (filtered or all)
- MCP server: all 28 tools, OAuth flow, rate limiting (Redis — NOT in-memory)
- AI form generation engine: prompt → validated FormSchemaV1 (claude-sonnet-4-6)
- `create_form` MCP tool using AI engine
- Partials pipeline: debounced beacon + upsert + resume token
- **Record rough-cut of the Claude Code demo video this week — even raw, for beta users**

**Verification:** Real Claude Code session completes the 3-call recipe; submission appears in inbox; webhook HMAC verifies externally; honeypot/time-trap scripted bot submit silently rejects.

### Phase 2 — Visual Builder + AI Panel (Weeks 5-6)

**Goal:** Full visual form builder in the dashboard + AI panel + form migration.

Tasks:
- Zustand draft store: FormSchemaV1 + snapshot undo + debounced autosave
- FieldPalette (type-registry-driven drag-and-drop)
- BuilderCanvas (real `<FormRenderer mode="preview">` — structural WYSIWYG)
- FieldInspector: all field settings
- LogicEditor: when/then rule builder + cycle detection
- ThemeEditor: live CSS var editing
- PageManager: multi-step page ordering
- PublishBar: diff vs published + publish action
- AI panel: prompt/URL/PDF → generates schema → merges into draft
- AI Question Suggestions sidebar
- Form Migration (Lab feature): URL → scrape → schema conversion
- Timebox hard at 2 weeks — ship good, not novel

### Phase 3 — Framer Component + Embeds (Weeks 7-8)

**Goal:** Framer Marketplace component, `embed.js`, `@fieldo/react` package. Submit to Marketplace end of week 8.

Tasks:
- `FieldoForm.tsx` Framer component: canvas skeleton, live render, theme props, schema version negotiation
- esbuild pipeline: inline renderer + form-core, target < 150KB
- Canvas vs published behavior (no tracking on canvas)
- `/embed.js` script: no-iframe DOM injection, host font inheritance
- `@fieldo/react` npm package: zero-install self-contained variant
- Dashboard: embed code generator UI (all 5 targets)
- `generate_embed_code` MCP tool (all 5 targets)
- QR code generation for hosted links
- **Submit to Framer Marketplace end of week 8** (review has latency — submit before phase 4)

**Verification:** Component in a real Framer project — canvas skeleton, preview live render, published site submit lands in inbox; `embed.js` on plain HTML page; `@fieldo/react` in a Next.js app.

### Phase 4 — Analytics + Spam Depth (Weeks 9-10)

**Goal:** Field-level analytics pipeline, AI friction insights, spam scoring panel.

Tasks:
- `/api/v1/events` beacon ingestion (batched, idempotent)
- `form_events` partition setup + daily rollup jobs
- Analytics query layer: views → starts → completions funnel; field drop-off curve; time-per-field; refocus rate; error rate
- Dashboard analytics pages: field funnel chart, time-per-field bar, AI insights card, "apply suggestion" CTA
- AI friction insights pipeline (Groq — aggregates only): generate per-form insight, cache in `forms.ai_insights`
- Analytics MCP tools: `get_field_funnel`, `get_friction_insights`, `get_workspace_analytics`
- Spam scoring panel in dashboard: per-form score threshold config, spam folder UI
- `embed_source` segmentation in analytics

**Verification:** Scripted sessions with deliberate field-3 abandonment → funnel shows the cliff → AI insight names the field and recommends a fix.

### Phase 5 — Launch (Weeks 11-12)

**Goal:** Billing, limits, Founding offer, MCP listings, Product Hunt, 15-20 beta users.

Tasks:
- Stripe billing integration: Free/Pro/Business subscription tiers + Founding lifetime ($129, 150-seat cap)
- Plan enforcement: submission limits, file storage caps, analytics history gates, MCP rate limits
- Framer badge (free tier): "Powered by Fieldo" in the hosted page footer + embedded forms
- MCP directory listings: Smithery, mcp.so, Glama, PulseMCP, Cursor directory, Anthropic connectors page, awesome-mcp-servers PR
- Documentation: quickstart, MCP guide, embed guide, Framer Marketplace description
- 15-20 beta users from Seelo list: onboard, gather feedback, fix blockers
- **Hero video production:** 90-second + 30-second vertical (the 3-call Claude Code recipe → live form → inbox + field funnel updating in real time)
- Product Hunt launch assets: tagline, gallery, maker comment
- Framer Marketplace listing live (dependent on wk 8 submission + approval)

**Verification:** Free-tier 250-cap enforced; Founding checkout completes; Marketplace listing live; MCP directory listed in 4+ registries.

### Slip Rule (Week 8 checkpoint)

If behind schedule at week 8:
- **CUT:** analytics depth (ship counts-only, skip time-per-field and AI insights)
- **NEVER CUT:** Framer component surface, hosted link surface, MCP surface, inbox, spam folder

---

## 9. Pricing

### 9.1 Tiers

| | Free | Pro | Business |
|---|---|---|---|
| Price | $0 | $15/mo ($12 annual) | $39/mo ($32 annual) |
| Forms | Unlimited | Unlimited | Unlimited |
| Submissions/mo | 250 | 5,000 | 50,000 |
| File storage | — | 10 GB | 100 GB |
| Inbox | ✅ full | ✅ full | ✅ full |
| Spam stack + folder | ✅ free | ✅ free | ✅ free |
| Submission analytics (counts) | 7-day | 12-month | 12-month |
| Field funnel + AI insights | ❌ | ✅ | ✅ |
| Partial capture UI | ❌ | ✅ | ✅ |
| Auto-responder | ❌ | ✅ | ✅ |
| Fieldo badge | Shown | Hidden | Hidden |
| MCP | Rate-limited | Full | Full |
| Seats / RBAC | 1 | 1 | Unlimited |
| CRM routing rules | ❌ | ❌ | ✅ |
| Native Slack/Sheets | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |
| Custom domains | ❌ | ❌ | ✅ |

**Pricing rationale:**
- Free tier competes with Framer-native (same "free Framer experience") not with Tally (unlimited subs is Tally's moat — don't fight that fight; win on inbox + native rendering)
- 250 subs/mo is generous for a real lead-gen form on a Framer site; tight enough to push growing sites to Pro
- $15/mo is below Tally Pro ($29) and dramatically below Typeform; positions as "the Framer-native version"
- Inbox + spam stack free forever: this is a promise, not a tier gate. It builds the wedge and trust.

### 9.2 Founding Member Offer

**$129 one-time → Pro-for-3-years (or lifetime capped at 150 seats)**

- Beats FramerForms Basic ($79) on value, Pro ($119) on features, Commercial ($189) on price
- Front-loads cash for a solo founder with no runway
- Caps liability (not truly unlimited lifetime — 3 years or 150 seats, then converts to Pro monthly at prevailing rate)
- Language for Framer ecosystem: "lifetime language" is what Framer plugin buyers understand

Founding offer closes when: 150 seats sold OR 6 months after launch, whichever comes first.

---

## 10. Go-to-Market

### 10.1 Launch sequence

**T-2 weeks (beta):**
- 15-20 beta users from Seelo list (Ravi's existing audience)
- Record hero video (raw cut sufficient for beta)
- Iterate on biggest friction points

**Week 0 (launch day):**
- (1) Framer Marketplace listing (hero copy: "Submissions that don't disappear. No iframe." — speaks directly to FramerForms users who want a backend)
- (2) MCP directory submissions same week — Smithery, mcp.so, Glama, PulseMCP, Cursor directory, Anthropic connectors, awesome-mcp-servers PR — **this is uncontested territory; file early**
- (3) Product Hunt +3-5 days after Marketplace (let Marketplace traction build first)

### 10.2 Positioning lines (by audience)

| Audience | Line |
|---|---|
| vs Framer native users | "Your submissions shouldn't disappear into an email." |
| vs FramerForms users | "They make the form. We own the data." |
| vs Tally users | "They embed an iframe. We render in your design system — and your agent can drive us." |
| vs generic form builders | "One form, five surfaces, one inbox, one agent API." |
| For MCP/AI directories | "Give your AI agent a full forms infrastructure — create forms, publish them, and query field analytics in three tool calls." |

**Never market:** "AI builds your form" — Weavely, Makeform, and every new AI SaaS does this. Market "your agent operates your forms infrastructure."

### 10.3 Content + community

- **Framer community:** answer every "where do my Framer form submissions go?" thread and every spam thread (Ravi has standing via Seelo). One honest answer, link to Fieldo.
- **Twitter content (14 weeks, builders/founders):** Already planned — ship the schedule from the Onto content plan format
- **Cursor/Claude Code communities:** "give your agent a forms backend" guide — this audience is underserved by form tool marketing
- **SEO targets:** "framer form submissions inbox", "framer forms analytics", "framer forms MCP", "create a form with Claude", "framerforms alternative with backend" — own these before competitors show up
- **Seelo cross-sell:** banner, email sequence, optional bundle pricing

### 10.4 Framer Marketplace copy strategy

Headline: **"Forms with an inbox. Native rendering. No iframe."**

Description key beats (in order):
1. Submissions land in your Fieldo inbox — not your email, not a spreadsheet
2. Real Framer component — no iframe, full design-token inheritance
3. Conditional logic, multi-step, file uploads
4. Field-level analytics: see which question kills your conversion
5. AI agent ready: connect Claude and manage your forms in plain English

---

## 11. Success Metrics (6 Months Post-Launch)

| Metric | Target | Notes |
|---|---|---|
| Framer Marketplace installs | 4,000–6,000 | Comparable: FramerForms 10k in ~18 months |
| Workspaces created | 2,500–3,500 | — |
| Activation rate | ≥ 45% | Definition: published form + 1 real submission received |
| Paying customers | 110–160 | — |
| MRR | $2,500–$3,500 | Subscription |
| Founding revenue | $10,000–$15,000 | One-time, front-loaded |
| MCP-originated forms | ≥ 15% of new forms | If < 5%, rethink agent GTM |
| Spam precision | > 95% caught | — |
| Spam recall (false positives) | < 1% | Publish this number — trust signal |
| Field funnel "apply suggestion" CTR | Track from day 1 | Leading indicator of analytics value |

---

## 12. Risks & Mitigations

| Risk | Severity | Probability | Mitigation |
|---|---|---|---|
| Proofly ships integrated form builder + analytics before Fieldo launches | High | High | Ship before they complete the stack (3-4 month window). Their inbox, builder, and MCP are disconnected retrofits; integrated-from-day-1 is the structural advantage. Speed is the moat right now. |
| Framer ships native inbox | High | Medium | Analytics + MCP + universal embeds are Framer-independent. Degrade gracefully to "Tally with native rendering + agent API." Keep analytics depth as the irreplaceable leg. |
| FramerForms adds a backend | Medium | Low | 10k lifetime buyers makes metered re-pricing extremely painful for them. Speed + analytics depth + MCP. |
| MCP market gets crowded (it already has) | Medium | Certain | Our MCP differentiator is Framer-native forms-infrastructure, not "has MCP." Tally/Jotform MCP is for Tally/Jotform users. Ours is for Framer builders. |
| Tally adds native Framer component | Low | Low | Their architecture (iframe SaaS) makes native rendering a near-rewrite. Not in their product roadmap or incentive set. |
| Analytics event volume overwhelms Postgres | Medium | Low (Y1) | Client batching, batch inserts, monthly partitions, daily rollups. ClickHouse migration path documented and ready. |
| PII / compliance issues | High | Low | Per-form retention setting, delete-on-request tooling, encrypt destination secrets, never send raw answers to Groq, document all subprocessors. GDPR: data hosted in EU or allow EU-region selection. |
| Component version skew (Marketplace breakage) | Medium | Medium | schemaVersion negotiation on every meta request, skip-unknown-field-types forward-compat, append-only meta contract. FrameVidPlayer precedent shows this pattern works. |
| Solo scope creep | High | High | The shared renderer (one renderer, three skins), the written OUT list, and the week-8 slip rule exist precisely to prevent this. Enforce them. |
| Framer Marketplace approval delay | Low | Low | FrameVidPlayer precedent (same fetch/beacon patterns approved). Submit week 8. Hosted + MCP launch not gated on approval. |

---
## Additional features to build
- Partial capture UI (events collected in v1, UI in v1.1)
- Native Slack / Google Sheets / Notion destinations (webhook covers them in v1)
- Logic groups (AND/OR) — single-condition rules only in v1
- Scheduling/open/close date UI (server enforces it, no builder UI in v1)
- QR code generation (add in v1.1, 1-day task)
- A/B form version testing (v1.1)
- PWA + push notifications (v1.1)
- Payments / checkout forms
- Quizzes + calculators (concede to FramerForms as their add-on — different job)
- E-signature
- Audio responses
- File review AI
- A/B field-level experiments
- Approval workflows
- White-label / agency rebrand
- CRM gallery (HubSpot/Salesforce direct push)
- Custom domains (Business v1.1)
- Framer-plugin builder UI (dashboard builder ships v1; plugin builder is v2)

---

## 14. Files to Port from FrameVid

Verified against `C:\Users\11ara\github\FramerVid`:

| File/Module | Action |
|---|---|
| `packages/db/schema.ts` | Copy generic tables verbatim; use `leads`/`videoEvents` as template patterns only |
| `apps/dashboard/app/lib/auth.ts`, `resolve-auth.ts`, `oauth.ts` | Copy verbatim |
| `apps/dashboard/app/oauth/**`, `app/well-known/**` | Copy verbatim |
| `apps/dashboard/app/[transport]/route.ts` | Copy; update tool list |
| `apps/dashboard/lib/mcp/context.ts` | Copy; **fix in-memory rate limiter → Redis** (critical) |
| `apps/dashboard/lib/mcp/tools/*` | Use as pattern; replace with Fieldo tools |
| `apps/dashboard/lib/mcp/embed.ts` | Copy; generalize for 5 embed targets |
| `apps/dashboard/app/api/events/route.ts` | Copy; already has form_* event types |
| `apps/dashboard/app/lib/analytics-queries.ts` | Copy curve/cliff patterns; adapt for field-level |
| `apps/dashboard/app/lib/groq-friction.ts` | Copy Groq pipeline; swap video metrics for form field metrics |
| `apps/dashboard/app/api/videos/[videoId]/leads/route.ts` | Use as template for submit pipeline |
| `apps/component/src/FrameVidPlayer.tsx` | Use as pattern for Framer component structure + canvas behavior |
| `apps/dashboard/app/v/[videoId]/page.tsx` | Use as pattern for `/f/[formId]` hosted page |

**Pre-build verification checklist:**
- [ ] MCP handler version vs mid-2026 MCP connector spec (check for breaking changes)
- [ ] R2 helper: content-type handling, max file size support, presigned URL TTL
- [ ] `/api/events` ingestion path: real endpoint, not mock — confirm batching logic works
- [ ] Worker deploy story: verify `Dockerfile.worker` / `fly.worker.toml` patterns still valid
- [ ] Redis client: confirm connection pooling for rate limiter + BullMQ on same instance or split

---

## 15. Open Decisions (Founder to Confirm)

| Decision | Options | Recommendation |
|---|---|---|
| Final name | Fieldo, Formee, Fieldee, Filloo | Fieldo — names the field-analytics moat, `.io` available, clean |
| Repo strategy | Fork FrameVid vs fresh repo seeded by copy | **Fresh repo** — no git-tracked lineage, cleaner history |
| Builder UX Phase 2 | Web dashboard builder first (recommended) vs Framer-plugin builder first | **Dashboard builder first** — Framer-plugin builder is Phase 2; dashboard ships in 2 weeks with less complexity |
| Founding seat count | 100 / 150 / 200 | **150** — enough to generate $15-20k, not so many it becomes a support burden |
| MCP auth for free tier | OAuth only vs also support API key | **OAuth primary** (matches Tally/Jotform pattern) + **API key secondary** for developers (lower friction for Claude Code) |
| EU data residency | Single-region vs EU option | Offer EU region for Business tier at launch (differentiator for agency clients) |

---

## Appendix A: Positioning Cheat Sheet

For every piece of copy, run it through these:

1. Does it mention "submissions disappear"? Good.
2. Does it mention "iframe"? Good.
3. Does it say "AI builds your form"? Remove it.
4. Does it say "your agent operates your forms"? Keep it.
5. Does it name the field funnel visually? Keep it.
6. Does it make a claim about "no competitor has X"? Verify against this doc before publishing.

## Appendix B: The 3-Call Demo Script

This is the product's most powerful marketing artifact. Practice until it takes under 90 seconds on video.

```
# Claude Code terminal, Fieldo MCP connected

> create_form("contact form for a B2B SaaS landing page — asks full name,
  work email, company size (dropdown: 1-10, 11-50, 51-200, 200+), and
  one open text question: what are you building?")

→ Created: cntct_8xKp2mQ (draft)
→ Fields: 4 fields, 1 page, 0 logic rules

> publish_form({ id: "cntct_8xKp2mQ" })

→ Published: v1
→ Live at: https://fieldo.io/f/cntct-8x

> generate_embed_code({ id: "cntct_8xKp2mQ", target: "framer" })

→ Framer component JSON (paste into Framer Marketplace URL field)
→ Component property: formId = "cntct_8xKp2mQ"

[Submit the form from the hosted link on mobile]

→ Dashboard inbox: 1 new submission (real-time)
→ Field funnel (5 more scripted sessions, Q3 abandoned):
   drop-off at "What are you building?" field visible
→ AI insight: "Open text question on page 1 causes 40% drop.
   Move to page 2 or make optional."
```

This 90-second video is the entire GTM strategy made concrete.
