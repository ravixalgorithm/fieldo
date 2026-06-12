import type { Metadata } from "next";
import { PageHeader, Section, P, C, DocTable, PageFooter } from "@/components/docs";

export const metadata: Metadata = { title: "MCP Tools" };

export default function ToolsPage() {
  return (
    <>
      <PageHeader title="MCP Tools">
        31 tools across five groups. Every call goes through the dashboard&apos;s validated API; destructive tools
        require an explicit <C>confirm: true</C>.
      </PageHeader>

      <Section title="Library (read)">
        <DocTable
          head={["Tool", "Scope", "Description"]}
          rows={[
            ["list_workspaces", "forms:read", "Workspaces for the credential. Local build returns the single workspace."],
            ["list_folders", "forms:read", "Form folders. Folders ship post-v1; returns the root folder."],
            ["list_forms", "forms:read", "All forms, filterable by status (draft|published|closed|archived) or title search."],
            ["get_form", "forms:read", "Full draft schema, status, slug, and submission count for one form."],
            ["search_forms", "forms:read", "Search across titles, slugs, and field labels."],
          ]}
        />
      </Section>

      <Section title="Management (write)">
        <DocTable
          head={["Tool", "Scope", "Description"]}
          rows={[
            ["create_form", "forms:write", "Create from a full FormSchemaV1 JSON or a natural-language description (AI pass with deterministic fallback)."],
            ["update_form_fields", "forms:write", "Replace one field's definition by field id."],
            ["add_field", "forms:write", "Append or insert a field on a page; id generated if omitted."],
            ["remove_field", "forms:write", "Remove a field and drop logic rules that reference it."],
            ["set_logic", "forms:write", "Replace logic rules — linted for cycles and dangling refs before saving."],
            ["update_form_settings", "forms:write", "Merge settings: submit behavior, spam thresholds, limits, dedupe, CORS origins."],
            ["update_form_theme", "forms:write", "Merge theme tokens: colors, font, radius, spacing."],
            ["publish_form", "forms:write", "Snapshot the draft as a new immutable version and point the live form at it."],
            ["unpublish_form", "forms:write", "Take the form offline; version history is kept."],
            ["duplicate_form", "forms:write", "Copy the draft schema into a new draft form."],
            ["delete_form", "forms:delete", "Permanently delete the form and all its data. Requires confirm: true."],
          ]}
        />
      </Section>

      <Section title="Submissions">
        <DocTable
          head={["Tool", "Scope", "Description"]}
          rows={[
            ["get_submissions", "submissions:read", "List with status filter (complete|flagged|rejected) and email/answer search."],
            ["get_submission", "submissions:read", "One submission with answers, spam signals, and metadata."],
            ["export_submissions", "submissions:read", "CSV download URL or inline JSON."],
            ["get_partial_submissions", "submissions:read", "Abandoned in-progress entries: answers so far, last field, email if captured."],
            ["mark_submission", "submissions:write", "read | unread | spam | unspam."],
            ["delete_submission", "submissions:write", "Permanent delete. Requires confirm: true."],
          ]}
        />
      </Section>

      <Section title="Analytics">
        <DocTable
          head={["Tool", "Scope", "Description"]}
          rows={[
            ["get_form_analytics", "analytics:read", "Top-level funnel: views, starts, completions, conversion rates."],
            ["get_field_funnel", "analytics:read", "Per-field drop-off curve: reach, median dwell, refocus, error rate."],
            ["get_friction_insights", "analytics:read", "Findings with recommendations: error hotspots, hesitation, reach cliffs."],
            ["get_workspace_analytics", "analytics:read", "Aggregate funnel across every form in the workspace."],
          ]}
        />
      </Section>

      <Section title="Developer">
        <DocTable
          head={["Tool", "Scope", "Description"]}
          rows={[
            ["get_form_api", "developer:read", "Endpoint URLs, schema version, and CORS config for direct HTTP integration."],
            ["generate_embed_code", "developer:read", "Paste-ready embed for framer, hosted, iframe, html, or react — or all five."],
            ["scaffold_form_integration", "developer:read", "Integration snippet per target, including a headless fetch-and-submit variant."],
            ["test_submit", "developer:read", "Submit a test payload through the real pipeline (validation, spam, dedupe); marked read, excluded from fan-out."],
            ["get_form_status", "developer:read", "published/draft/closed, live version, submission count, response limits, hosted URL."],
          ]}
        />
      </Section>

      <Section title="Example: diagnose and fix a leaky form">
        <P>A realistic multi-tool session an agent can run unassisted:</P>
        <DocTable
          head={["Step", "Tool", "Why"]}
          rows={[
            ["1", "get_form_analytics", "Completion rate is 31% — something is wrong."],
            ["2", "get_field_funnel", "Reach drops 58% at the “Budget” field."],
            ["3", "get_friction_insights", "Confirms the cliff and suggests making the field optional or moving it later."],
            ["4", "update_form_fields", "Sets required: false on the budget field."],
            ["5", "publish_form", "Ships the fix as version N+1; live immediately."],
          ]}
        />
      </Section>

      <PageFooter />
    </>
  );
}
