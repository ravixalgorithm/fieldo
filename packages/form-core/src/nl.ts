/**
 * Deterministic natural-language → FormSchemaV1 heuristic for `create_form`.
 * Stands in for the AI generation pass (PRD §5.3.8) until the AI worker ships;
 * recognizes the common field vocabulary of contact/lead/feedback forms.
 */
import type { FieldDef, FormSchemaV1 } from "@fieldo/types";

interface Pattern {
  match: RegExp;
  field: () => FieldDef;
}

let seq = 0;
const fid = (slug: string) => `fld_${slug}_${++seq}`;

const PATTERNS: Pattern[] = [
  {
    match: /\b(full |first |last )?name\b/i,
    field: () => ({ id: fid("name"), type: "text", label: "Name", required: true }),
  },
  {
    match: /\b(work |business |company )?e-?mail\b/i,
    field: () => ({ id: fid("email"), type: "email", label: "Email", required: true }),
  },
  {
    match: /\bphone|mobile|cell\b/i,
    field: () => ({ id: fid("phone"), type: "phone", label: "Phone" }),
  },
  {
    match: /\bcompany size|team size|employees\b/i,
    field: () => ({
      id: fid("company_size"),
      type: "select",
      label: "Company size",
      options: ["1-10", "11-50", "51-200", "201-1000", "1000+"].map((v) => ({ label: v, value: v })),
    }),
  },
  {
    match: /\bcompany|organization|organisation\b/i,
    field: () => ({ id: fid("company"), type: "text", label: "Company" }),
  },
  {
    match: /\bwebsite|url\b/i,
    field: () => ({ id: fid("website"), type: "url", label: "Website" }),
  },
  {
    match: /\bbudget\b/i,
    field: () => ({ id: fid("budget"), type: "number", label: "Budget" }),
  },
  {
    match: /\bdate|deadline|when\b/i,
    field: () => ({ id: fid("date"), type: "date", label: "Date" }),
  },
  {
    match: /\brating|stars|score|satisfaction\b/i,
    field: () => ({ id: fid("rating"), type: "rating", label: "Rating", validation: { max: 5 } }),
  },
  {
    match: /\b(file|upload|attachment|resume|cv)\b/i,
    field: () => ({ id: fid("file"), type: "file", label: "Attachment" }),
  },
  {
    match: /\bmessage|comments?|feedback|details|description|question\b/i,
    field: () => ({ id: fid("message"), type: "textarea", label: "Message" }),
  },
];

export function schemaFromDescription(description: string, title?: string): FormSchemaV1 {
  seq = 0;
  const fields: FieldDef[] = [];
  // consume matched text so e.g. "company size" doesn't also produce a "company" field
  let rest = description;
  for (const p of PATTERNS) {
    const m = p.match.exec(rest);
    if (!m) continue;
    rest = rest.replace(p.match, " ");
    fields.push(p.field());
  }
  // sensible default when nothing matched: minimal contact form
  if (fields.length === 0) {
    fields.push(
      { id: fid("name"), type: "text", label: "Name", required: true },
      { id: fid("email"), type: "email", label: "Email", required: true },
      { id: fid("message"), type: "textarea", label: "Message" }
    );
  }
  const inferredTitle =
    title ??
    (/(contact|feedback|waitlist|signup|sign-up|registration|survey|application|booking|quote|lead)/i
      .exec(description)?.[1]
      ?.replace(/^./, (c) => c.toUpperCase()) ?? "New") + " form";
  return {
    schemaVersion: 1,
    title: inferredTitle,
    pages: [{ id: "page_1", fields }],
    logic: [],
    theme: {},
    settings: {},
  };
}
