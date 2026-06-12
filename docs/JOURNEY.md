# Journey

## 2026-06-11 — Research & plan
Competitive research via onto (11 sources, 97.9% token reduction). Verified: Framer native has no inbox/logic/multi-step/uploads; native antispam shipped June 5 (killed spam as headline wedge); FramerForms has frontend but no backend; Proofly.ae = most dangerous adjacent (Inbox plugin + Framer MCP, could bundle). Full plan written: moat = native rendering + owned backend + field analytics + MCP. 12-week phasing, pricing, GTM, risks. → `docs/plan-v1.md`

## 2026-06-12 — Founder feature doc + project init
Founder expanded the feature set: AI Form Migration (competitor URL → Fieldo — promoted to headline launch feature), generate from PDF/URL, AI question suggestions, AI follow-up generator, theme presets→marketplace, PWA notifications, OTP, audio responses, A/B experiments. Slotted into v1/v1.1/v2 (→ `docs/prd.md`). Name decided: **Fieldo** (fieldo.io DNS-free; formik.io rejected — clashes with the React form library). Repo scaffolded: pnpm/turbo monorepo, apps (dashboard/component/worker) + packages (form-core/renderer/types/db/queue/config).
