import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePage } from "@/components/guides/guide-page";
import {
  AI_SOC_GUIDES,
  aiSocGuideBySlug,
  aiSocProjectBySlug,
} from "@/lib/ai-soc-prep/projects";

const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function resolve(slug: string) {
  const guide = aiSocGuideBySlug(slug);
  const project = aiSocProjectBySlug(slug);
  return guide && project ? { guide, project } : null;
}

export function generateStaticParams() {
  return AI_SOC_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = resolve(slug);
  if (!found) return { title: "Project not found" };

  const title = `${found.project.title} — AI SOC project ${found.project.n}`;
  const description = `${found.project.tagline} ${strip(found.guide.intro)}`.slice(
    0,
    300
  );

  return {
    title,
    description,
    alternates: { canonical: `/ai-soc-prep/projects/${slug}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AiSocProjectPage({
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
        kitLabel: "AI SOC ANALYST",
        backHref: "/ai-soc-prep/projects",
        projectNumber: project.n,
        title: project.title,
        tagline: project.tagline,
        tierLabel: project.difficulty,
        difficulty: project.difficulty,
        hours: project.hours,
        // These projects are free by construction — local models, public data.
        // Saying so where the other kits put a cost warning is the point.
        cost: "Free — local model, no API key, nothing leaves your machine",
        repoUrl: project.repoUrl,
        stack: project.stack,
        prerequisites: project.prerequisites,
        validation: project.validation,
        pitch: project.pitch,
        stretch: project.stretch,
        storageKey: "ai-soc-prep:guide",
      }}
    />
  );
}
