# Forms Platform — Full Product & Build Plan
*(working codename: **Fieldo** — final name TBD by founder; June 11, 2026)*

## 0. Market reality check (re-verified June 11, 2026 — including founder's challenge)

Verified directly against framer.com/updates and framer.com/help (not competitor marketing):

**Framer native forms still do NOT have:** multi-step, conditional logic, file uploads, real validation beyond required, payments, partial capture, or — critically — **any submissions inbox** (data fires to email/Google Sheets/webhook and is gone). Confirmed by Framer's own /forms page and help docs as of June 2026.

**What changed (founder was right to push):** **June 5, 2026 — Framer shipped native Antispam**: Basic (free, rule-based) + Advanced (AI, **Pro+ plans only**), with Pass/Block filtering and spam markers in email/Sheets/webhooks. → Our spam stack is **no longer a headline wedge**; it's table stakes + we differentiate on *reviewability* (flagged submissions land in an inbox you can inspect/recover — Framer has no inbox to review them in) and on it being free at every tier.

**Plugin ecosystem covers logic/multi-step/uploads** (this was never a native-vs-nothing gap):
- **FramerForms** (10k brands, $79/$119/$189 lifetime): multi-step, logic, uploads, quizzes/calculators — but rides Framer's backend; no inbox, no analytics.
- **Forms Plugin by Framer Geeks**: AI builder, 30+ field types, multi-step, logic, uploads, e-signature, CAPTCHA, native CRM integrations (Brevo/HubSpot/Mailchimp + 9 platforms, no Zapier needed). "Submission History & Tracking" = **delivery-status debugging** (successful/failed sends to integrations), NOT a lead inbox — data still routes onward to marketing platforms, they don't own it. No analytics.
- **Framer Form Kit** ($0/$69/$132): components only, no backend.
- **Proofly Forms Inbox** (verified June 2026): a plugin literally selling "every form deserves an inbox" — attaches an inbox to ANY Framer form (native/FramerForms/custom): search/filter, read-unread, bulk export CSV, attachments, email notifications, basic spam toggle. Free 50 subs, $14.99/mo unlimited. **Only 24 users** — tiny, but it VALIDATES the inbox gap and is the closest direct competitor on that wedge. Gaps: inbox-only retrofit (no builder/logic/hosted link/embeds), no analytics, no partial capture, no auto-responder/routing, no API/MCP for forms data.
- **Proofly MCP** (205 users, free): MCP for the Framer *canvas/project* (112 tools — design edits, CMS CRUD, audits; can insert form elements). NOT a forms-backend MCP — agents can't manage submissions/analytics/hosted forms. Our agent wedge ("agent operates your forms infrastructure") remains distinct, but **Proofly.ae is the most dangerous adjacent player**: they hold Forms + Inbox + MCP as separate pieces and could bundle.
- **Tally/Weavely/Makeform/HubSpot**: real backends, iframe embeds, $0–29/mo. Tally has partial submissions (Pro) — the only one.

**The actual moat (intersection nobody has):**
1. **Native rendering** (real component/DOM in Framer and on the web — no iframe)
2. **Owned backend** (inbox, partial/abandonment capture, lead routing)
3. **Field-level analytics** (drop-off funnel, time-per-field, AI friction insights — *no competitor at any price has this*)
4. **MCP/agent surface** (create/operate forms from Claude, Claude Code, Cursor, ChatGPT)

**Positioning one-liner:** *"Design-native forms with an owned inbox, field-level analytics, and an AI-agent API. Render natively in Framer, embed anywhere, or create one by chatting with Claude."*
- vs Framer native: "Your submissions shouldn't disappear into an email."
- vs FramerForms: "They make the form. We own the data."
- vs Tally: "They embed an iframe. We render in your design system — and your agent can drive us."
- **Never market "AI builds your form" (tired — Weavely/Makeform). Market "your agent operates your forms."**

---

## 1. Founder decisions (taken / pending)

| Decision | Status |
|---|---|
| All three surfaces in v1 (Framer component + hosted link/embeds + MCP) | ✅ decided by founder |
| Repo strategy | **Recommended: fresh repo seeded by copying FrameVid generic parts** (not fork-tracked). Pending founder confirm. |
| Builder UX | **Recommended: web dashboard builder + AI-prompt creation (one schema, two doors); Framer-plugin builder = phase 2.** Pending. |
| Name | Shortlist (domains spot-checked): **Fieldo** (fieldo.io avail — names the field-analytics moat), Formee (formee.io), Fieldee, Filloo. No "Framer" in name (trademark). Pending. |
| Pricing model | Subscription + capped "Founding" lifetime bridge (below). Pending. |

---

## 2. Architecture (reuses FrameVid at C:\Users\11ara\github\FramerVid)

### 2.1 Monorepo (fresh repo, pnpm + turbo, same tooling)
```
fieldo/
  apps/
    dashboard/    # Next.js — COPY: (auth), api/auth, api/workspaces, api/api-keys, oauth/**, well-known/**,
                  #   [transport]/route.ts (MCP), settings UI, workspace context.
                  #   NEW: forms CRUD, /f/[formId] hosted page, inbox, builder, analytics pages.
    component/    # Framer code component (FieldoForm.tsx) — pattern-copy FrameVidPlayer.tsx
    worker/       # BullMQ — COPY bootstrap; NEW jobs: submission.fanout, partial-GC, file-GC, exports
  packages/
    types/        # COPY generic + ADD FormSchemaV1, FieldDef, LogicRule, ThemeTokens, event enums
    db/           # COPY users/workspaces/members/invites/api_keys/oauth_clients/folders;
                  #   ADD forms, form_versions, submissions, submission_files, partial_submissions,
                  #   form_events, destinations, destination_deliveries
    form-core/    # NEW — zod validation + logic engine, zero React/DOM (the most important package)
    renderer/     # NEW — ONE React renderer consumed by: Framer component, /f page, embed.js, npm @fieldo/react
    queue/, config/  # COPY
```

### 2.2 Form schema (FormSchemaV1 — the single contract for builder, AI, renderer, server)
- Always **pages-of-fields** (single page = 1 page; multi-step free later).
- **FieldDef**: immutable nanoid `id`, `type`, label/placeholder/help, `required`, `validation` (per-type), `options`, `meta`. v1 types (~15): text, textarea, email, phone, url, number, select, radio, checkbox, multi-select, date, rating, file, hidden (UTM), statement. Deferred: payment, signature, matrix, ranking.
- **Logic**: `when {all/any [{fieldId, op, value}]} → then [{show|hide|jumpTo|setRequired}]`. Pure `evaluateLogic()` in form-core runs client (on change) AND server (on submit: re-derive visibility, strip hidden answers, exempt hidden requireds — never trust client).
- **Theme tokens**: fontFamily (+ `inherit` from host page — key for Framer), color set, radius, spacing, labelStyle, button, progressBar → emitted as CSS variables (no CSS-in-JS runtime).
- **Settings**: submitBehavior (message/redirect), notifications (owner email + auto-responder), spam (honeypot, minSecondsToSubmit, optional Turnstile, threshold, flag|reject), limits (maxResponses, open/closeAt), partials, privacy (public/unlisted/password), allowedOrigins.
- **Versioning**: draft mutates freely; **Publish snapshots into immutable `form_versions`** + repoints `forms.published_version_id` (instant rollback). Submissions pin `form_version_id`. `schemaVersion` int for the Marketplace component contract: meta endpoint accepts `?supportedSchema=N`; v1 ships only "unknown field type → skip + warn, never crash" (down-compilation designed-in but deferred).

### 2.3 DB (new tables; uuid PKs, workspace-cascade, Drizzle — FrameVid conventions)
- **forms**: id, workspace_id, title, slug (short public id), status (draft/published/closed/archived), draft_schema jsonb, published_version_id, submission_count (denorm), created_by, timestamps.
- **form_versions**: form_id, version (unique per form), schema jsonb, schema_version, published_by.
- **submissions** (evolves `leads`): form_id, form_version_id, answers jsonb {fieldId: value}, denorm email (indexed), spam_score + spam_signals, status (complete/flagged/rejected), dedupe_key (sha256, nullable), session_id, referrer/country/device/UA, time_to_complete_ms, read_at (inbox unread). Index (form_id, created_at desc).
- **submission_files**: pre-submit rows (submission_id null → GC'd at 24h), field_id, R2 storage_key, mime/size.
- **partial_submissions**: unique(form_id, session_id), answers (last-write-wins), last_field_id, **email captured on blur** (abandonment-recovery goldmine, paid feature), resume_token, 30d TTL.
- **form_events** (clone of videoEvents): form_id, event_type, field_id, page_id, session_id, duration_ms, device/country/referrer, **embed_source (framer|hosted|iframe|react|html — unique segment data)**, jsonb. Postgres v1, monthly partitions if needed; ClickHouse later.
- **destinations** + **destination_deliveries**: type (email/webhook/slack/google_sheets), config jsonb (encrypt secrets), retry audit.

### 2.4 Renderer strategy — one core, three skins
- `form-core` (no React): zod schemas, validateSubmission, evaluateLogic, theme typing, event constants. **One validator everywhere — never two implementations.**
- `renderer` (React): `<FormRenderer schema theme onSubmit apiBaseUrl mode="live|preview|canvas" />` — fields per type, paging, logic subscription, inline validation, sendBeacon analytics, honeypot/time-trap, presigned file upload.
- **Framer component**: props formId + apiBaseUrl (hidden advanced) + `useDashboardTheme` toggle → grouped override controls (per-token merge over dashboard theme; dashboard = source of truth, panel = instance override). `RenderTarget.canvas` → static schema skeleton, no tracking (follow FrameVidPlayer's approved behavior). esbuild-inline renderer+core into dist, <~150KB.
- **Hosted page** `/f/[formId]`: SSR published version (OG tags, themed OG image), privacy gate, hydrate renderer. `?embed=1` strips chrome + postMessage auto-height for iframe target.
- **Embeds** (extend FrameVid `lib/mcp/embed.ts` builders): iframe / html `<script src=/embed.js>` (no-iframe DOM render, inherits fonts) / react + nextjs (npm `@fieldo/react` AND zero-install self-contained variant) / framer (marketplace link + property JSON).

### 2.5 Submission pipeline (`POST /api/v1/forms/{id}/submit`, CORS per allowedOrigins)
1. Load published version → 404/410 (+closed message, limits via submission_count/closeAt).
2. **Redis** sliding-window rate limit (per IP+form, per form). *(FrameVid's in-memory limiter is a verified weakness — Redis from day one.)*
3. Spam score accumulation: honeypot +1.0 → **server-issued signed render-timestamp token** (meta endpoint) for the time-trap +0.6 → disposable-email list +0.3 → link/keyword heuristics +0.2 → Turnstile verify (built-in, free — vs FramerForms's $189 BYO-key) +1.0. Reject = silent 200 + status=rejected (don't teach bots); flag = inbox spam folder.
4. Server re-validate (logic-aware) → 422 with field errors.
5. Verify file refs; attach. 6. Dedupe (optional unique-by-email) → 409 duplicate.
7. Insert + counter + delete matching partial. 8. Enqueue `submission.fanout` (worker: owner email via Resend → auto-responder → HMAC-signed webhook w/ retries → Slack incoming-webhook → Sheets append; Zapier/Make ride the webhook). 9. Return {submissionId, behavior}.
- **Uploads**: `POST /forms/{id}/uploads` → presigned R2 PUT (reuse storage abstraction), plan caps.
- **Partials**: debounced 2s + visibilitychange beacons → upsert; resume_token in localStorage (FrameVid unlock pattern).

### 2.6 Analytics (port of FrameVid retention system; field replaces time-bucket)
- Events: form_view, form_start, field_focus, field_blur(+dwell), field_error, page_next/back, form_abandon, submit_attempt/success/error. Ingest: clone of `app/api/events/route.ts` (already enumerates form_* types), batched beacons.
- Queries (`lib/analytics/form-queries.ts`): funnel (views→starts→completes), **field drop-off curve + reuse cliff-detection**, time-per-field + refocus + error rate, segments by embed_source/device/country.
- **AI friction insights**: reuse Groq pipeline — feed ONLY aggregates/labels (never raw answer values — PII) → "Field 4 'Company size' causes 40% abandonment; make optional or move to page 2." Cache in forms.ai_insights.

### 2.7 MCP server (~28 tools; mount + defineTool wrapper copied as-is, rate limiter → Redis)
- Scopes: forms:read/write/delete, submissions:read/write, analytics:read, developer:read (role mapping mirrors FrameVid).
- **library**: list/search/get_form, list_workspaces, list_folders.
- **management** (write-guarded): `create_form` (**JSON schema OR natural-language description** → server LLM → validated schema — same engine as the dashboard AI panel), update_form_fields, add_field, remove_field, set_logic (server lints cycles), update_form_settings/theme, publish_form, unpublish, duplicate, delete_form (confirm-arg).
- **analytics**: get_form_analytics, get_field_funnel, get_friction_insights, get_workspace_analytics, get_submissions/get_submission, export_submissions (signed URL), get_partial_submissions, mark_submission, delete_submission.
- **developer**: get_form_api, generate_embed_code (5 targets), scaffold_form_integration, **test_submit** (flagged test, excluded from analytics/fan-out), get_form_status.
- Headline recipe in server instructions: `create_form(description) → publish_form → generate_embed_code` — three calls from Claude to a live form.

### 2.8 Public API surface (v1)
`GET /api/v1/forms/{id}/meta` (published schema+theme, no notification-config leak, signed render token, CDN 60s SWR) · `POST .../submit` · `POST .../uploads` · `POST/GET .../partials` · `POST /api/v1/forms/events` · `GET /f/{id}` · `GET /embed.js`. Internal: forms CRUD/publish/versions/submissions/analytics/destinations + copied auth/oauth/well-known/MCP routes.

### 2.9 Builder UX (architecture note — full design later)
Single zustand draft store of FormSchemaV1 + snapshot undo + debounced autosave. Components: FieldPalette (type-registry-driven), BuilderCanvas (**the real renderer in preview mode** — WYSIWYG is structural), FieldInspector, LogicEditor (live lint), ThemeEditor (live CSS vars), PreviewPane, PublishBar (diff vs published). AI panel calls the same create_form engine → merges into draft. AI and hands share one artifact.

---

## 3. v1 cut (ruthless — solo builder, ~12 weeks)

**Table stakes IN:** ~15 field types, multi-step, conditional logic (single-condition rules; AND/OR groups v1.1), validation, thank-you/redirect, owner email + auto-responder, webhook, CSV export, token theming + custom CSS escape hatch.
**Differentiators IN (not cuttable):** inbox (read/unread/search/spam folder), field-level analytics + AI insights, free spam stack w/ reviewable flags, Framer component, MCP (+in-app AI generation — same engine, near-free).
**OUT v1.1:** partial-capture UI (events already collected), native Slack/Sheets/Notion, custom domains, logic groups, scheduling/caps UI.
**OUT v2:** payments, quizzes/calculators (concede to FramerForms — different job), signatures, A/B tests, approval flows, white-label, CRM gallery.
**Slip rule (week 8):** cut analytics depth to counts-only; **never** cut a surface, the inbox, or MCP.

## 4. Phasing (12 weeks)

| Phase | Weeks | Deliverable | FrameVid unlock |
|---|---|---|---|
| 0 Core | 1–2 | FormSchemaV1 + form-core + renderer pkg + submit pipeline + /f page. **Demo: API→link→submission in DB** | auth/workspaces/RBAC ported day 1 |
| 1 Inbox+MCP | 3–4 | Inbox UI, notifications, webhook, CSV; MCP w/ OAuth + core tools + prompt→schema. **Demo: the Claude launch video scenario works — record rough cut now** | leads plumbing, MCP framework, OAuth |
| 2 Builder | 5–6 | Visual builder + AI panel. Timebox hard — good, not novel | — (pure new UI) |
| 3 Component+Embeds | 7–8 | Framer component, embed.js, @fieldo/react. **Submit to Marketplace by end of wk 8** (review latency) | FrameVidPlayer patterns |
| 4 Analytics+Spam | 9–10 | Field funnel, time-per-field, AI insights; spam scoring + folder | events route, retention/cliff/Groq pipeline |
| 5 Launch | 11–12 | Billing, limits, badge, docs, MCP listings, PH assets, 15–20 beta from Seelo list | billing scaffold |

## 5. Pricing

Subscription (backend has marginal cost — never uncapped lifetime):
- **Free**: unlimited forms, **250 submissions/mo**, full inbox, full spam stack, counts-analytics 7d, badge, MCP rate-limited. (Competes with Framer-native, not Tally-free.)
- **Pro $15/mo** ($12 annual): 5k subs/mo, 10GB files, **field funnel + AI insights + 12-mo history**, badge off, auto-responder, full MCP.
- **Business $39/mo**: 50k subs/mo, 100GB, seats/RBAC, CRM routing rules, exports.
- **Founding bridge**: $129 one-time = Pro-for-3-years (or lifetime capped at first 150–200) — speaks the Framer ecosystem's lifetime language, beats FramerForms $119/$189 on value, front-loads cash, caps liability.
- Upgrade triggers scale with success (volume, badge, analytics) — inbox + spam stay free forever (the wedge, never the toll).

## 6. GTM

T-2wk: 15–20 beta from Seelo list; record **90-sec hero video** (Claude Code → create_form → link → phone submission → inbox + funnel update live) + 30s vertical. Launch order: (1) Framer Marketplace (copy leads with "submissions that don't disappear / no iframe"), (2) MCP directories same week (Smithery, mcp.so, Glama, PulseMCP, Cursor directory, Anthropic connectors, awesome-mcp-servers PR — uncontested), (3) ProductHunt +3–5 days. Ongoing: answer every "where do my Framer form submissions go"/spam thread (founder has Seelo standing); Cursor/Claude Code communities ("give your agent a forms backend" guide); Seelo cross-sell banner/email/bundle; SEO on complaint+comparison+MCP keywords (own "create a form with Claude" before anyone shows up).

## 7. Success metrics (6 mo)
4–6k Marketplace installs · 2.5–3.5k workspaces · ≥45% activation (published + 1 real submission) · 110–160 paying · $2.5–3.5k MRR + $10–15k Founding · **≥15% of new forms MCP-originated** (if <5%, rethink agent GTM) · >95% spam caught <1% false-positive (publish it).

## 8. Top risks
1. **Framer keeps absorbing gaps** (proved it: Oct 2025 unlimited submissions, June 2026 AI antispam). → Multi-leg by design; inbox/analytics/MCP/universal-embeds are Framer-independent; degrade gracefully to "Tally with native rendering + agent API."
2. **Proofly.ae bundles Forms + Inbox + MCP** (they already hold all three pieces separately; inbox at 24 users today). → Ship the *integrated* story fast — their pieces are disconnected retrofits with no builder/hosted-link/analytics; our moat is one schema across builder/component/link/agent. Framer Geeks' delivery-tracking is a lesser version of the same threat.
3. **FramerForms adds a backend** → their 10k lifetime base makes metered re-pricing painful; speed + analytics depth + MCP.
4. **Marketplace approval friction/delay** → FrameVidPlayer precedent (same fetch/beacon patterns approved); submit wk 8; hosted+MCP launch not gated on it.
5. **Component version skew** (uninstallable updates) → schemaVersion negotiation param + skip-unknown-types + append-only meta contract.
6. **form_events volume** → client batching, batch inserts, monthly partitions, daily rollups; ClickHouse path.
7. **PII/compliance** → per-form retention setting, delete-on-request tooling, encrypt destination secrets, never send raw answers to Groq, document subprocessors.
8. **Solo scope creep** → shared renderer (one renderer, three skins), the written OUT list, the week-8 slip rule.

## 9. Critical FrameVid files to port (verified)
- `packages/db/schema.ts` — generic tables verbatim; `leads`/`videoEvents` = templates for `submissions`/`form_events`
- `apps/dashboard/app/lib/auth.ts`, `resolve-auth.ts`, `oauth.ts`, `app/oauth/**`, `app/well-known/**` — auth/OAuth stack
- `apps/dashboard/app/[transport]/route.ts` + `lib/mcp/context.ts` + `lib/mcp/tools/*` — MCP framework (**fix in-memory rate limiter → Redis**)
- `apps/dashboard/lib/mcp/embed.ts` — embed string builders (generalize)
- `apps/dashboard/app/api/events/route.ts` — beacon ingestion (already has form_* event types)
- `apps/dashboard/app/lib/analytics-queries.ts` + Groq friction pipeline — curve/cliff/AI patterns
- `apps/dashboard/app/api/videos/[videoId]/leads/route.ts` — submission-route template (dedupe, validation)
- `apps/component/src/FrameVidPlayer.tsx` — Marketplace-approved component patterns
- `apps/dashboard/app/v/[videoId]/page.tsx` — hosted-page pattern
- Pre-build verification list: mcp-handler version vs mid-2026 connector spec; R2 helper content-type/size support; `/api/events` real ingestion path + headroom; worker deploy story (Dockerfile.worker/fly.worker.toml).

## 10. Verification (how we know each phase works)
- **Phase 0**: curl create→publish→submit; submission row + version pinning in DB; logic-hidden field injection rejected server-side.
- **Phase 1**: real Claude Code session runs `create_form(description)→publish_form→generate_embed_code`; submission appears in inbox; webhook HMAC verifies; spam honeypot/time-trap silently rejects a scripted bot submit.
- **Phase 3**: component in a real Framer project — canvas skeleton, preview live render, published-site submit lands in inbox; embed.js on a plain HTML page; @fieldo/react in a Next app.
- **Phase 4**: scripted sessions with deliberate field-3 abandonment → funnel shows the cliff; AI insight names the field.
- **Phase 5**: free-tier 250-cap enforcement; Founding checkout; Marketplace listing live.
