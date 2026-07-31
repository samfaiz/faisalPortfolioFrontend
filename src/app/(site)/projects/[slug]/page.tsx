import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { LiveViewer } from "@/components/live-viewer";
import { CaseStudyView } from "@/components/case-study";
import { guideForProject } from "@/lib/guide-link";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, faqJsonLd } from "@/lib/seo";
import { projectJsonLd, projectBreadcrumbJsonLd, displayImage } from "@/lib/project";

const SITE_URL = "https://faisalkhan.dev";

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await api.project(slug);
  if (!project) return { title: "Project not found" };
  return buildMetadata(project.seo ?? null, {
    title: project.title,
    description: project.description,
    image: displayImage(project),
  });
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = await api.project(slug);
  if (!project) notFound();

  const url = `${SITE_URL}/projects/${project.slug}`;
  const faq = faqJsonLd(project.seo?.faq);
  const jsonLd = [
    projectJsonLd(project, { url, siteUrl: SITE_URL, image: displayImage(project) }),
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

        {project.hero_image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={project.hero_image}
            alt=""
            className="mt-6 aspect-2/1 w-full rounded-lg border-[1.5px] border-hairline bg-surface-alt object-cover object-top"
          />
        )}

        <div className="mono-label mt-6 flex items-center gap-3 text-faint">
          <span className="text-accent-strong">{project.category.replace(/-/g, " ").toUpperCase()}</span>
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

        {(project.repo_url || project.url) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mono-label inline-flex items-center gap-2 rounded-pill border-[1.5px] border-ink px-4 py-2.5 text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                VIEW SOURCE
              </a>
            )}
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mono-label inline-flex items-center gap-2 rounded-pill border-[1.5px] border-hairline px-4 py-2.5 text-muted-2 transition-colors hover:border-ink hover:text-ink"
              >
                OPEN LIVE SITE ↗
              </a>
            )}
          </div>
        )}

        {/* Rich text from the CMS. Colours set in the editor are used as-is,
            so a hardcoded dark colour will be unreadable on the dark theme. */}
        {project.body_html && (
          <div
            className="soc-prose mt-8 max-w-3xl"
            dangerouslySetInnerHTML={{ __html: project.body_html }}
          />
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
            <LiveViewer projects={[project]} categories={[]} />
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
