import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { LiveViewer } from "@/components/live-viewer";
import { JsonLd } from "@/components/json-ld";
import { api } from "@/lib/api";
import { buildMetadata, faqJsonLd, fetchPageSeo } from "@/lib/seo";

const fallbackMeta = {
  title: "Projects",
  description: "Live, in-page previews of deployed projects — security tools and full-stack apps built with AI.",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchPageSeo("projects");
  return buildMetadata(seo, fallbackMeta);
}

export default async function ProjectsPage() {
  const [projects, seo] = await Promise.all([api.projects(), fetchPageSeo("projects")]);
  const faq = faqJsonLd(seo?.faq);
  return (
    <>
      {seo?.json_ld?.length ? <JsonLd data={seo.json_ld} /> : null}
      {faq ? <JsonLd data={faq} /> : null}
      <PageHeader line1="TRY THEM" line2="LIVE." breadcrumb="~/projects" />
      <section className="px-4 py-10 sm:px-5">
        <div className="mx-auto max-w-6xl">
          <LiveViewer projects={projects} />
        </div>
      </section>
    </>
  );
}
