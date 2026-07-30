import type { Metadata } from "next";
import Link from "next/link";
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

  // Case-study projects are lab work with no deployed site, so they have no
  // business in a viewer headed "TRY THEM LIVE". Left in, the viewer told
  // visitors "this site blocks in-page framing" — describing a site that does
  // not exist. They still get a card below and their own full page.
  const liveProjects = projects.filter((p) => !p.case_study);

  return (
    <>
      {seo?.json_ld?.length ? <JsonLd data={seo.json_ld} /> : null}
      {faq ? <JsonLd data={faq} /> : null}
      <PageHeader line1="TRY THEM" line2="LIVE." breadcrumb="~/projects" />
      <section className="px-4 py-10 sm:px-5">
        <div className="mx-auto max-w-6xl">
          {liveProjects.length > 0 && <LiveViewer projects={liveProjects} />}

          {projects.length > 0 && (
            <nav className="mt-8 border-t border-divider pt-6">
              <div className="mono-label text-faint">FULL PROJECT PAGES</div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="mono-label rounded-pill border-[1.5px] border-hairline px-3 py-1.5 text-muted-2 transition-colors hover:border-ink hover:text-ink"
                    >
                      {p.title} ↗
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
