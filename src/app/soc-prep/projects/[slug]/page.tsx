import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePage } from "@/components/guides/guide-page";
import { LEVEL_NAMES } from "@/lib/soc-prep/data";
import { SOC_GUIDES } from "@/lib/soc-prep/guides";
import { PROJECTS } from "@/lib/soc-prep/projects";

const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Resolve a slug to its guide + the project it documents. */
function resolve(slug: string) {
  const guide = SOC_GUIDES.find((g) => g.slug === slug);
  if (!guide) return null;
  const project = PROJECTS.find((p) => p.id === guide.projectId);
  if (!project) return null;
  return { guide, project };
}

export function generateStaticParams() {
  return SOC_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = resolve(slug);
  if (!found) return { title: "Guide not found" };

  const title = `${found.project.title} — step-by-step SOC project guide`;
  const description = `${found.project.tagline} ${strip(found.guide.intro)}`.slice(0, 300);

  return {
    title,
    description,
    alternates: { canonical: `/soc-prep/projects/${slug}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SocProjectGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = resolve(slug);
  if (!found) notFound();

  const { guide, project } = found;

  return (
    <GuidePage
      guide={guide}
      chrome={{
        kitLabel: "SOC PREP",
        backHref: "/soc-prep#projects",
        projectNumber: project.id,
        title: project.title,
        tagline: project.tagline,
        tierLabel: LEVEL_NAMES[project.level],
        hours: project.hours,
        cost: project.cost,
        stack: project.stack,
        prerequisites: project.prerequisites,
        validation: project.validation,
        pitch: project.pitch,
        stretch: project.stretch,
        storageKey: "soc-prep:guide",
      }}
    />
  );
}
