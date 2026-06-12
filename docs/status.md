# Status

**Phase 0 — Core (weeks 1–2)** · started June 12, 2026

## Done
- [x] Repo scaffolded (pnpm + turbo monorepo, structure per plan-v1 §2.1)
- [x] PRD v2 (plan + founder feature doc merged, v1/v1.1/v2 slotting)
- [x] Name: **Fieldo** (fieldo.io free as of June 12 — REGISTER IT)

## Next (Phase 0 exit = curl create→publish→submit, row in DB)
- [ ] Register fieldo.io
- [ ] Port from FrameVid: auth/OAuth stack, workspaces/RBAC, db generic tables, queue/config packages (plan-v1 §9 file list)
- [ ] `packages/types`: FormSchemaV1, FieldDef, LogicRule, ThemeTokens, event enums
- [ ] `packages/form-core`: zod validation + evaluateLogic (client+server)
- [ ] `packages/db`: forms, form_versions, submissions, submission_files, partial_submissions, form_events, destinations
- [ ] `packages/renderer`: FormRenderer (live|preview|canvas)
- [ ] dashboard: forms CRUD API, publish/versioning, POST /api/v1/forms/{id}/submit pipeline, /f/[formId] hosted page
- [ ] Pre-build verification: mcp-handler version vs mid-2026 connector spec; R2 helper; /api/events headroom; worker deploy story
