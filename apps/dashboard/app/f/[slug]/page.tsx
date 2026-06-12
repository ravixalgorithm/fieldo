import { notFound } from "next/navigation";
import { getFormBySlug, getFormById, getPublishedSchema } from "@/lib/forms";
import { issueRenderToken } from "@/lib/render-token";
import { HostedForm } from "./hosted-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const form = getFormBySlug(params.slug) ?? getFormById(params.slug);
  return { title: form ? `${form.title} — Fieldo` : "Form — Fieldo" };
}

export default function HostedFormPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { embed?: string };
}) {
  const form = getFormBySlug(params.slug) ?? getFormById(params.slug);
  if (!form) notFound();
  const published = getPublishedSchema(form);
  if (!published || form.status !== "published") {
    return (
      <div className="hosted-wrap" style={{ justifyContent: "center", textAlign: "center" }}>
        <div>
          <h2>This form is not available</h2>
          <p className="muted">It may be unpublished or closed.</p>
        </div>
      </div>
    );
  }
  const embed = searchParams.embed === "1";
  if (embed) {
    return (
      <div style={{ padding: 4 }}>
        <HostedForm schema={published.schema} formId={form.id} renderToken={issueRenderToken(form.id)} embedSource="iframe" />
      </div>
    );
  }
  return (
    <div className="hosted-wrap">
      <div className="hosted-card">
        <h1 style={{ fontSize: 23, marginTop: 0, marginBottom: 22 }}>{published.schema.title}</h1>
        <HostedForm schema={published.schema} formId={form.id} renderToken={issueRenderToken(form.id)} embedSource="hosted" />
      </div>
      <p className="hosted-footer">
        Powered by <a href="/">Fieldo</a>
      </p>
    </div>
  );
}
