# Design handoff — demo workspace

Use this when hosting a build for visual design / screen exploration.

## 1. Seed mock data

From the repo root:

```bash
pnpm --filter @fieldo/dashboard seed:demo
```

This resets the **Acme Corp** demo workspace and fills it with forms, submissions, destinations, delivery failures, analytics events, and an API key.

Re-run anytime to refresh numbers. Pass `--no-fresh` only if you want to keep other workspaces untouched (demo workspace is still cleared).

## 2. Log in

| | |
|---|---|
| **URL** | http://localhost:3210/login |
| **Email** | `designer@fieldo.demo` |
| **Password** | `design-demo` |

## 3. Screens with real data

| Screen | Path |
|--------|------|
| Command center (overview) | `/` |
| Forms library | `/forms` |
| Form builder | `/forms/frm_demo_waitlist` |
| Inbox | `/forms/frm_demo_waitlist/inbox` |
| Spam folder | `/forms/frm_demo_feedback/inbox` → Spam tab |
| Field analytics | `/forms/frm_demo_waitlist/analytics` |
| Settings + API keys | `/settings` |
| Public hosted form | `/f/product-waitlist` |
| Developer docs — overview | `/developers` |
| Developer docs — MCP server | `/developers/mcp-server` |
| Developer docs — MCP tools | `/developers/tools` |
| Developer docs — REST API | `/developers/rest-api` |
| Developer docs — Embeds | `/developers/embeds` |

## 4. What's in the demo data

- **Product waitlist** — 140+ submissions, email + Slack + failing webhook (shows attention queue)
- **Enterprise demo request** — sales form with CRM webhook
- **Customer feedback** — mix of inbox + flagged spam submissions
- **Launch webinar** — smaller published form
- **Partner intake** — stale draft (18 days) for “needs attention”
- **Untitled campaign** — empty draft for builder empty states

Workspace name is **Acme Corp** (matches enterprise Figma wireframe).

## 5. Hosting for the designer

Deploy **only** `apps/dashboard` to Vercel (root directory: `apps/dashboard`). One deployment includes the dashboard, hosted forms, and developer docs.

```bash
pnpm --filter @fieldo/dashboard seed:demo
pnpm --filter @fieldo/dashboard dev
```

On Vercel after deploy, the **build step runs `seed:demo` automatically** — no manual seed needed. Optional env vars:

| Variable | Purpose |
|----------|---------|
| `FIELDO_AUTH_SECRET` | Session signing secret (set a random string in production) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL — used in developer docs code samples |
| `FIELDO_DB_PATH` | Override SQLite path (default: `/tmp/fieldo.db` on Vercel) |

**Do not use demo credentials in production** beyond design previews.
