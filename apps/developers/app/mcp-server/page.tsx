import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section, P, Code, C, DocTable, PageFooter, Callout } from "@/components/docs";

export const metadata: Metadata = { title: "MCP Server" };

export default function McpServerPage() {
  return (
    <>
      <PageHeader title="MCP Server">
        Fieldo ships a Model Context Protocol server so Claude, Cursor, and any MCP client can operate your forms
        infrastructure — create, publish, read submissions, analyze drop-off, and generate embeds.
      </PageHeader>

      <Section title="What your agent can do">
        <P>
          This is not dashboard-access-over-RPC. The 31 tools cover the full loop a human would do across the
          builder, inbox, and analytics — so an agent can run it end to end: draft a form from a sentence, publish
          an immutable version, watch submissions arrive, spot the field where visitors bail, and fix it.
        </P>
        <Callout>
          The flagship demo: <C>create_form</C> → <C>publish_form</C> → <C>generate_embed_code</C>. Three calls
          from a sentence to a live form on your site. See <Link href="/tools">MCP Tools</Link> for the catalog.
        </Callout>
      </Section>

      <Section title="Setup — Claude Code">
        <P>From the Fieldo repo (the server lives in <C>apps/mcp</C>; the dashboard must be running):</P>
        <Code>{`# 1. start the dashboard (the MCP server drives its API)
cd apps/dashboard && pnpm dev          # http://localhost:3210

# 2. register the server with Claude Code
claude mcp add fieldo -- pnpm --dir <repo>/apps/mcp start`}</Code>
        <P>Then ask Claude: <em>"Create a waitlist form asking name and email, publish it, and give me the embed code."</em></P>
      </Section>

      <Section title="Setup — Claude Desktop">
        <P>Add to <C>claude_desktop_config.json</C> (Settings → Developer → Edit Config):</P>
        <Code>{`{
  "mcpServers": {
    "fieldo": {
      "command": "pnpm",
      "args": ["--dir", "C:/path/to/fieldo/apps/mcp", "start"],
      "env": {
        "FIELDO_API_URL": "http://localhost:3210",
        "FIELDO_API_KEY": "fld_..."
      }
    }
  }
}`}</Code>
      </Section>

      <Section title="Configuration">
        <DocTable
          head={["Env var", "Default", "Purpose"]}
          rows={[
            ["FIELDO_API_URL", "http://localhost:3210", "Origin of the Fieldo dashboard API the tools drive."],
            ["FIELDO_API_KEY", "—", "Workspace API key (fld_…) from Settings → API keys. Required — the management API is authenticated."],
          ]}
        />
        <P>
          Transport is <strong>stdio</strong>. The server is stateless — every tool call goes through the same
          validated dashboard API the UI uses, so agents can never bypass schema validation, logic linting, or the
          spam pipeline.
        </P>
      </Section>

      <Section title="Safety model">
        <DocTable
          head={["Guard", "Behavior"]}
          rows={[
            ["Destructive confirms", "delete_form and delete_submission refuse to run without confirm: true."],
            ["Schema validation", "Every write re-validates through parseFormSchema — invalid schemas and logic cycles cannot be saved."],
            ["Test isolation", "test_submit runs the real pipeline but is marked read and excluded from fan-out and analytics."],
            ["Scopes (hosted)", "forms:read/write/delete, submissions:read/write, analytics:read, developer:read — enforced per credential when OAuth ships."],
          ]}
        />
      </Section>

      <PageFooter />
    </>
  );
}
