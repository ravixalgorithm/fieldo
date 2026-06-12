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

## NEXT STEP

1. Framer component (`apps/component/FieldoForm.tsx`) + `embed.js` + `@fieldo/react`
2. MCP server (28 tools per PRD §5.3.8) + OAuth/auth port from FrameVid
3. Worker fan-out (email/webhook), AI form generation, builder UI
