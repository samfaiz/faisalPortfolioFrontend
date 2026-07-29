import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { projectForGuide } from "@/lib/guide-link";
import { GuidePage } from "@/components/guides/guide-page";
import { TIER_NAMES } from "@/lib/cloud-prep/data";
import { CLOUD_GUIDES } from "@/lib/cloud-prep/guides";
import { CLOUD_PROJECTS } from "@/lib/cloud-prep/projects";

const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Resolve a slug to its guide + the project it documents. */
function resolve(slug: string) {
  const guide = CLOUD_GUIDES.find((g) => g.slug === slug);
  if (!guide) return null;
  const project = CLOUD_PROJECTS.find((p) => p.id === guide.projectId);
  if (!project) return null;
  return { guide, project };
}

export function generateStaticParams() {
  return CLOUD_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = resolve(slug);
  if (!found) return { title: "Guide not found" };

  const title = `${found.project.title} — step-by-step cloud security project guide`;
  const description = `${found.project.tagline} ${strip(found.guide.intro)}`.slice(0, 300);

  return {
    title,
    description,
    alternates: { canonical: `/cloud-security-prep/projects/${slug}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CloudProjectGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = resolve(slug);
  if (!found) notFound();

  // A portfolio project may document having actually built this. The API
  // client falls back to an empty list if it is unreachable, so a build
  // without the API simply omits the link rather than failing.
  const built = projectForGuide(await api.projects(), slug);

  const { guide, project } = found;

  return (
    <GuidePage
      guide={guide}
      chrome={{
        kitLabel: "CLOUD SEC.",
        backHref: "/cloud-security-prep#projects",
        builtProject: built
          ? { title: built.title, href: `/projects/${built.slug}` }
          : null,
        projectNumber: project.id,
        title: project.title,
        tagline: project.tagline,
        tierLabel: TIER_NAMES[project.tier],
        hours: project.hours,
        cost: project.cost,
        stack: project.stack,
        prerequisites: project.prerequisites,
        validation: project.validation,
        pitch: project.pitch,
        stretch: project.stretch,
        storageKey: "cloud-prep:guide",
      }}
    />
  );
}
