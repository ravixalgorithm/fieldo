# Fieldo

**Design-native forms with an owned inbox, field-level analytics, and an AI-agent API.**
Render natively in Framer, embed anywhere, or create one by chatting with Claude.

- vs Framer native: "Your submissions shouldn't disappear into an email."
- vs FramerForms: "They make the form. We own the data."
- vs Tally: "They embed an iframe. We render in your design system — and your agent can drive us."

## Monorepo

```
apps/
  dashboard/    # Next.js — auth, forms CRUD, /f/[formId] hosted pages, inbox, builder, analytics, MCP
  component/    # Framer code component (FieldoForm.tsx)
  worker/       # BullMQ — submission fan-out, partial GC, file GC, exports
packages/
  form-core/    # zod validation + logic engine, zero React/DOM — runs client AND server
  renderer/     # ONE React renderer: Framer component, /f page, embed.js, @fieldo/react
  types/        # FormSchemaV1, FieldDef, LogicRule, ThemeTokens, event enums
  db/           # Drizzle schema (Postgres/Supabase)
  queue/        # BullMQ helpers (Redis/Upstash)
  config/       # shared tsconfig/eslint
```

## Docs

- `docs/prd.md` — current product spec (plan + founder feature doc merged, v1/v1.1/v2 slotting)
- `docs/plan-v1.md` — original full plan (June 11, 2026, research-verified)
- `docs/status.md` — build status
- `docs/JOURNEY.md` — session log

Seeded architecturally from FrameVid/Seelo (`~/github/FramerVid`) — auth, OAuth, MCP framework, analytics pipeline patterns port from there.
