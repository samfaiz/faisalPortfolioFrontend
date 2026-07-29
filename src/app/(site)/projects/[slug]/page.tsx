import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { LiveViewer } from "@/components/live-viewer";
import { CaseStudyView } from "@/components/case-study";
import { guideForProject } from "@/lib/guide-link";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, faqJsonLd } from "@/lib/seo";
import { projectJsonLd, projectBreadcrumbJsonLd } from "@/lib/project";

const SITE_URL = "https://faisalkhan.dev";

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await api.project(slug);
  if (!project) return { title: "Project not found" };
  return buildMetadata(project.seo ?? null, {
    title: project.title,
    description: project.description,
    image: project.preview_image ?? null,
  });
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = await api.project(slug);
  if (!project) notFound();

  const url = `${SITE_URL}/projects/${project.slug}`;
  const faq = faqJsonLd(project.seo?.faq);
  const jsonLd = [
    projectJsonLd(project, { url, siteUrl: SITE_URL, image: project.preview_image ?? null }),
    projectBreadcrumbJsonLd(project, SITE_URL),
    ...(project.seo?.json_ld ?? []),
    ...(faq ? [faq] : []),
  ];

  return (
    <section className="px-4 py-10 sm:px-5">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-6xl">
        <div className="mono-label flex items-center gap-1 text-muted-2">
          <Link href="/projects" className="hover:text-ink">~/projects</Link>
          <span>/{project.slug}</span>
        </div>

        <div className="mono-label mt-6 flex items-center gap-3 text-faint">
          <span className="text-accent-strong">{project.category.replace("-", " ").toUpperCase()}</span>
          {project.url && <span className="truncate">{project.url}</span>}
        </div>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] font-bold leading-tight tracking-[-0.03em]">
          {project.title}
        </h1>
        <p className="mt-4 max-w-3xl text-[19px] leading-[1.7] text-muted">{project.description}</p>

        {project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <span key={t} className="mono-label rounded-pill border border-hairline px-2.5 py-1 text-muted-2">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Lab work has no URL to frame, so a filled-in case study replaces the
            live viewer entirely rather than sitting under an empty one. */}
        <div className="mt-8">
          {project.case_study ? (
            <CaseStudyView
              caseStudy={project.case_study}
              guide={guideForProject(project)}
            />
          ) : (
            <LiveViewer projects={[project]} />
          )}
        </div>

        {(project.seo?.faq?.length ?? 0) > 0 && (
          <div className="mx-auto mt-12 max-w-3xl border-t border-divider pt-8">
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">FAQ</h2>
            <dl className="mt-5 space-y-5">
              {project.seo!.faq.map((f, i) => (
                <div key={i}>
                  <dt className="font-semibold text-ink">{f.q}</dt>
                  <dd className="mt-1.5 leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-10">
          <Link href="/projects" className="mono-label rounded-pill border-[1.5px] border-ink px-4 py-2.5 text-ink transition-colors hover:bg-ink hover:text-paper">
            ← ALL PROJECTS
          </Link>
        </div>
      </div>
    </section>
  );
}
