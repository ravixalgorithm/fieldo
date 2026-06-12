# Fieldo — Product Spec (v2, June 12 2026)

Merges the research-verified plan (`plan-v1.md`, June 11) with the founder's expanded feature doc (June 12). The plan-v1 architecture, DB schema, MCP tool list, pricing, GTM, and risks remain authoritative — this doc adds the feature slotting.

## One-liner

Design-native forms with an owned inbox, field-level analytics, and an AI-agent API. Render natively in Framer, embed anywhere, or create one by chatting with Claude.

## The moat (intersection nobody has)

1. **Native rendering** — real component/DOM in Framer and on the web, no iframe
2. **Owned backend** — inbox, partial/abandonment capture, lead routing
3. **Field-level analytics** — drop-off funnel, time-per-field, refocus/error rates, AI friction insights (no competitor has this at any price)
4. **MCP/agent surface** — create/operate forms from Claude, Claude Code, Cursor, ChatGPT. Marketing rule: never "AI builds your form" — always **"your agent operates your forms."**

## Feature slotting

### v1 (12 weeks — see plan-v1 §4 phasing)

- **Fields (~16):** text, textarea, email, phone, url, number, password, select, radio, checkbox, multi-select, date, rating, OTP-ready text, file, hidden (UTM), statement/heading
- Multi-step + conditional logic (single-condition rules; AND/OR groups v1.1)
- Validation (per-type), thank-you/redirect, owner email + **auto-responder**, webhook, CSV export
- **Inbox**: read/unread, search, spam folder (reviewable + recoverable, free at every tier)
- **Spam stack**: honeypot, signed time-trap, disposable-email list, heuristics, built-in Turnstile — free
- **Field-level analytics**: funnel (views→starts→completes), per-field drop-off + cliff detection, time-per-field, error/refocus rates, AI recommendations ("remove this question / change this label / add logic")
- **AI Form Generator**: from prompt, from website URL, from uploaded PDF/doc — one engine, three doors (dashboard panel + MCP `create_form`)
- **AI Form Migration**: paste a competitor form URL (Tally/Typeform/Google Forms) → converted Fieldo form. *Headline launch feature — collapses switching cost.*
- **MCP server** (~28 tools): create/operate forms, read submissions, query analytics, generate embeds
- **Surfaces**: Framer code component + hosted `/f/` link + embed.js + iframe + `@fieldo/react` — one schema, one inbox
- **Theme presets** (first-party, ~6): Apple, Stripe, Linear, Notion, Minimal SaaS + token theming + custom CSS escape hatch
- **QR code** for hosted links
- Partial/abandonment capture events + **email-on-blur** collection (UI in v1.1)

### v1.1 (post-launch)

- Partial-capture inbox UI + abandonment recovery emails
- **PWA + push notifications** ("new lead" on your phone — pairs with the inbox wedge)
- OTP field verification (email/phone codes), logic AND/OR groups
- **AI Question Suggestions**: missing questions, duplicate detection, field-type recommendations
- **AI Follow-Up Generator**: personalized reply/support/sales drafts after submission (Pro upsell)
- Native Slack/Sheets/Notion destinations, custom domains, scheduling/caps UI

### v2

- **A/B Experiments**: test versions, auto-pick winner (rides `form_versions`)
- **Payments**, **e-signature**
- **Audio responses** (voice-note answers — Deepgram transcription ports from Seelo)
- **AI File Review** (summarize uploaded files)
- **Theme Marketplace** (user-published themes; presets graduate into it)
- CRM gallery, lead routing rules UI (basic routing in Business tier earlier), white-label, approval flows
- Quizzes/calculators stay **conceded to FramerForms** unless demand proves otherwise

## Pricing (from plan-v1 §5)

- **Free**: unlimited forms, 250 subs/mo, full inbox + full spam stack (the wedge — free forever), 7d counts analytics, badge
- **Pro $15/mo** ($12 annual): 5k subs/mo, 10GB files, field funnel + AI insights + 12-mo history, badge off, auto-responder, full MCP
- **Business $39/mo**: 50k subs/mo, 100GB, seats/RBAC, routing rules, exports
- **Founding $129 one-time** = Pro-for-3-years, capped at first 150–200

## Non-negotiables

- One validator/logic engine (`form-core`) runs client AND server — never two implementations
- One renderer, three skins (Framer component / hosted page / embeds)
- Week-8 slip rule: cut analytics depth to counts-only; **never** cut a surface, the inbox, or MCP
- Never send raw answer values to LLMs (aggregates/labels only — PII)
- Redis rate limiting from day one (FrameVid's in-memory limiter was a verified weakness)
