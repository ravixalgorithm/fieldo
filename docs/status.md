# Build Status — June 12, 2026

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

## Where we stopped (NEXT STEP)

`pnpm install` ✅, dev server runs ✅ (`cd apps/dashboard && pnpm dev` → http://localhost:3210, home returns 200).

**Mid-verification, interrupted.** The end-to-end curl test (create → publish → meta → submit variants) failed at step 1: the parse of the create-form response failed — the POST to `/api/forms` response shape needs inspecting. First action on resume:

```bash
curl -s -i -X POST http://localhost:3210/api/forms -H 'content-type: application/json' -d '{"title":"Debug form"}'
```

Then re-run the full verification: valid submit, hidden-field injection strip, 422 on missing required, honeypot silent reject, check inbox + spam folder + analytics in the UI.

## After verification

1. Commit (done alongside this file)
2. Framer component (`apps/component/FieldoForm.tsx`) + `embed.js` + `@fieldo/react`
3. MCP server (28 tools per PRD §5.3.8) + OAuth/auth port from FrameVid
4. Worker fan-out (email/webhook), AI form generation, builder UI
