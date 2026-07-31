/**
 * Structured data for project detail pages. Web apps are described as a
 * schema.org SoftwareApplication (the most citable type for a deployed app);
 * everything else as a CreativeWork. Plus a BreadcrumbList (Projects → item).
 */
import type { Project } from "./types";

export function projectJsonLd(
  project: Project,
  opts: { url: string; siteUrl: string; image?: string | null },
): Record<string, unknown> {
  const isApp = project.category === "web-apps" || project.category === "web-dev";

  return {
    "@context": "https://schema.org",
    "@type": isApp ? "SoftwareApplication" : "CreativeWork",
    name: project.title,
    description: project.description,
    url: opts.url,
    ...(project.url ? { sameAs: project.url } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    ...(project.tags?.length ? { keywords: project.tags.join(", ") } : {}),
    ...(isApp
      ? { applicationCategory: "WebApplication", operatingSystem: "Web" }
      : {}),
    author: { "@type": "Person", name: "Faisal Khan", url: opts.siteUrl },
    inLanguage: "en",
  };
}

export function projectBreadcrumbJsonLd(project: Project, siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Projects", item: `${siteUrl}/projects` },
      { "@type": "ListItem", position: 2, name: project.title, item: `${siteUrl}/projects/${project.slug}` },
    ],
  };
}

/**
 * The picture that represents a project outside its own page — the grid card
 * and the social share preview.
 *
 * Order: the hero when it has been marked as the display image, then an
 * explicit thumbnail, then the preview screenshot, then the first case-study
 * screenshot. That last fallback matters for lab projects, which often have
 * screenshots but no dedicated thumbnail.
 */
export function displayImage(p: Project): string | null {
  if (p.hero_is_display && p.hero_image) return p.hero_image;
  if (p.thumbnail?.url) return p.thumbnail.url;
  if (p.preview_image) return p.preview_image;
  return p.case_study?.steps.find((s) => s.image)?.image ?? null;
}
