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
      <div style={{ maxWidth: 560, margin: "80px auto", fontFamily: "system-ui", textAlign: "center" }}>
        <h2>This form is not available</h2>
        <p style={{ color: "#6b7280" }}>It may be unpublished or closed.</p>
      </div>
    );
  }
  const embed = searchParams.embed === "1";
  return (
    <div style={{ maxWidth: 640, margin: embed ? "0" : "48px auto", padding: 24, fontFamily: "system-ui" }}>
      {!embed && <h1 style={{ fontSize: 24 }}>{published.schema.title}</h1>}
      <HostedForm
        schema={published.schema}
        formId={form.id}
        renderToken={issueRenderToken(form.id)}
        embedSource={embed ? "iframe" : "hosted"}
      />
      {!embed && (
        <p style={{ marginTop: 32, fontSize: 12, color: "#9ca3af" }}>
          Powered by <a href="/" style={{ color: "#6b7280" }}>Fieldo</a>
        </p>
      )}
    </div>
  );
}
