# Build Status — June 12, 2026 (updated after verification)

## Done (Phase 0 + inbox slice, uncommitted → now committed)

- **packages/types** — full `FormSchemaV1` types: 17 field types, logic rules, theme tokens, settings, event enums
- **packages/form-core** — zod schema (`parseFormSchema`), `evaluateLogic` (+ cycle lint), logic-aware `validateSubmission` (strips logic-hidden answers server-side), `extractEmail`, spam scoring (`scoreSubmission`: honeypot, time-trap, disposable email, link/keyword heuristics, configurable flag/reject thresholds)
- **packages/db** — Drizzle + better-sqlite3 (**v12 required**, v11 fails to build on Node 24). SQLite for local dev, schema mirrors PRD Postgres shape. DB file at `.data/fieldo.db`. Tables: forms, form_versions, submissions, partial_submissions, form_events
- **packages/renderer** — single `<FormRenderer>`: all field types, multi-step paging + progress, logic, inline validation, honeypot, event beacons (sendBeacon), debounced partial capture + visibilitychange abandon, modes live/preview/canvas, `--fieldo-*` CSS vars
- **apps/dashboard** (Next.js 14, port **3210**):
  - Public API: `GET /api/v1/forms/{id}/meta` (signed render token), `POST .../submit` (full PRD §5.3.9 pipeline: limits, rate-limit, spam score w/ silent reject, server re-validation, dedupe-by-email, partial cleanup), `POST .../partials`, `POST /api/v1/events`
  - Internal API: forms CRUD, publish (immutable version snapshot + repoint), submissions list/CSV/actions, field-level analytics (reach, dwell, refocus, error rate)
  - UI: forms list + contact template, JSON editor w/ live `<FormRenderer mode="preview">`, share/embed tab, inbox w/ spam folder + detail + recover/delete, analytics page, hosted `/f/[slug]` (SSR + `?embed=1`)
- No auth yet (single-user local). In-memory rate limit (Redis later). Worker/MCP/Framer component not started.

## Verification — DONE ✅

The earlier create-form failure was Next/webpack bundling better-sqlite3 (`bindings` lookup broke with "Cannot read properties of undefined (reading 'indexOf')"). `serverComponentsExternalPackages` wasn't taking effect because better-sqlite3 wasn't resolvable from `apps/dashboard` under pnpm. Fixed by adding `better-sqlite3` as a direct dashboard dependency + explicit server webpack external in `next.config.mjs`.

Full e2e suite in `scripts/e2e-verify.sh` (run with dev server up: `bash scripts/e2e-verify.sh`) — all pass:
create → publish → meta/render-token → valid submit → logic-hidden-field injection stripped server-side → 422 on missing required → honeypot silent reject (fake 200, stored `rejected`) → dedupe-by-email 409 → stored statuses/email correct → analytics 200.

## Phase 3 embeds — DONE ✅ (June 12)

- **packages/react** (`@fieldo/react`) — `<FieldoForm id apiBaseUrl theme onSubmitted />`: fetches `/meta?supportedSchema=1`, renders shared `<FormRenderer>`; exports `fetchFormMeta`, re-exports `FormRenderer`
- **apps/component** — Framer code component `src/FieldoForm.tsx`: property controls (formId, dashboard-vs-custom theme with per-token overrides, advanced apiBaseUrl), `RenderTarget.canvas` → skeleton/no-tracking, live → full renderer, embedSource="framer". `pnpm build` (esbuild, ESM, externals react/framer) → dist 19.9 KB gz (budget 150). Typechecks (framer module shimmed in `src/framer.d.ts`)
- **embed.js** — `apps/dashboard/embed/embed.tsx` → `pnpm build:embed` → `public/embed.js` (IIFE, React inlined, 64.7 KB gz). `<script src=".../embed.js" data-form="frm_…" [data-api=origin]>` injects form after the script tag, embedSource="html"
- **Verified in a real headless browser**: embed.js on a foreign-origin page (port 8077) rendered, submitted, success message shown; stored submission status=complete, embedSource=html, spamScore=0. Test page: `scripts/embed-test/index.html` (form id hardcoded — recreate if DB reset)
- Not done from Phase 3: Marketplace submission (needs real Framer project), OG image gen, postMessage auto-height for iframe embed

## MCP server — DONE ✅ (June 12)

- **apps/mcp** (`@fieldo/mcp`) — stdio MCP server (`pnpm start`, needs dashboard on :3210; `FIELDO_API_URL` overrides). 31 tools across all PRD §5.3.8 groups: Library (workspaces/folders stubbed for single-user, list/get/search forms), Management (create incl. NL-description heuristic in `src/nl.ts`, field add/remove/update, set_logic, settings/theme merge, publish/unpublish/duplicate, delete w/ confirm guard), Submissions (list/get/export/partials/mark/delete w/ confirm), Analytics (form funnel, field funnel, heuristic friction insights, workspace aggregate), Developer (form API info, embed code for 5 targets, scaffold integration, test_submit through the real pipeline marked read, form status)
- New dashboard routes for it: `POST /api/forms/[id]/unpublish`, `POST /api/forms/[id]/duplicate`, `GET /api/forms/[id]/partials`
- **Verified** via `node scripts/mcp-verify.mjs` (real stdio JSON-RPC client): 19/19 incl. the headline recipe create_form(NL) → publish → generate_embed_code
- Deferred: OAuth (no auth in app yet — single-user local), AI-powered create_form (deterministic keyword heuristic for now), hosted remote endpoint

## Fan-out — DONE ✅ (June 12)

- **DB**: `destinations` (email|webhook|slack, json config, enabled) + `destination_deliveries` (pending|retrying|success|failed, attempts, error audit). Note: drizzle 0.36 needs record-style extraConfig (array style fails typecheck)
- **Engine** `apps/dashboard/lib/fanout.ts` — in-process (BullMQ worker later, delivery fns are extraction-ready): per enabled destination → audit row → attempt with exponential backoff ×3 (`FANOUT_RETRY_BASE_MS`, default 5s → 25s → 125s). Webhook: HMAC `x-fieldo-signature: sha256=…` with auto-generated `whsec_` secret. Email: Resend API (`RESEND_API_KEY`, `FIELDO_EMAIL_FROM`), owner or autoResponder mode; fails with clear audit reason when key missing. Slack: incoming-webhook text post
- Wired into submit step 8: only `pass` verdicts (flagged awaits spam review), `sessionId=mcp_test` (MCP test_submit) excluded
- **Routes**: `GET/POST /api/forms/[id]/destinations`, `GET/PATCH/DELETE .../destinations/[did]` (GET includes last 100 deliveries). Form DELETE cascades destinations+deliveries
- **Verified** `node scripts/fanout-verify.mjs` (needs server w/ `FANOUT_RETRY_BASE_MS=1000`): 13/13 — HMAC verifies externally, flaky endpoint succeeds on attempt 3, email-without-key audited, test-session + disabled-destination exclusions. e2e (9) + MCP (19) suites still green

## AI generation + builder UI — DONE ✅ (June 12)

- **AI form generation**: `POST /api/ai/generate-form` (`lib/ai.ts`) — provider chain Grok (`XAI_API_KEY`, `XAI_MODEL` default grok-4-fast, OpenAI-compatible structured output via fetch) → Claude (`ANTHROPIC_API_KEY`, @anthropic-ai/sdk, adaptive thinking, structured output (`output_config.format` json_schema mirroring FormSchemaV1 incl. logic), result re-validated by `parseFormSchema`. **Falls back to the deterministic keyword heuristic when `ANTHROPIC_API_KEY` unset** (heuristic moved to `@fieldo/form-core` `nl.ts`); also falls back on refusal stop_reason. MCP `create_form` now calls this endpoint for NL descriptions. AI path is typechecked but only runtime-exercised with a key — local verification ran the heuristic path
- **Builder UI** (`components/builder.tsx` + rewritten `app/forms/[id]/page.tsx`): tabs Build | JSON | Theme | Settings | Share. Build = palette (15 field types) → drag-reorderable field list (HTML5 DnD) → property panel (label/placeholder/help/required/options/hiddenSource); multi-page add/remove. Theme = color pickers + tokens. Settings = submit behavior, dedupe, time-trap, maxResponses, allowedOrigins. Schema object is single source of truth; JSON tab and live preview stay in sync. Home page got an "✨ Generate with AI" box
- **Verified in a real browser**: NL description → generated form landed in builder → renamed field, added phone → publish → hosted page reflected edits → live submit stored complete with all answers (incl. rating). All suites green: e2e 9, MCP 19, fanout 13

## Developer docs site — DONE ✅ (June 12)

- **apps/developers** (`@fieldo/developers`, port **3211**, `pnpm dev`) — FramerVid/Seelo-pattern docs shell (sidebar + rounded reading pane, same Fieldo tokens/fonts). Pages: Overview (quickstart, surfaces, architecture), MCP Server (Claude Code + Claude Desktop setup, config, safety model), MCP Tools (all 31 documented w/ scopes), REST API (public v1 + management endpoints, webhook HMAC verification, spam-score table), Embeds (all 5 surfaces w/ snippets)
- Dashboard sidebar links to it ("Developers ↗")

## NEXT STEP (post-v1 / hardening)

1. Auth (multi-user), Postgres + Redis swap, BullMQ worker extraction
2. Framer Marketplace submission, OG images, iframe auto-height postMessage
3. Logic rule builder UI (logic editable via JSON tab / MCP set_logic only), file upload field backend (presigned R2), partials resume UI
