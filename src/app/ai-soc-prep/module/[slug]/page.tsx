import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AiSocModulePage } from "@/components/ai-soc-prep/module-page";
import { MODULES, moduleBySlug } from "@/lib/ai-soc-prep/data";

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = moduleBySlug(slug);
  if (!m) return { title: "Module not found" };

  const title = `${m.title} — AI SOC Analyst module ${m.n}`;
  const description = `${m.summary} ${m.objectives.join(". ")}`.slice(0, 300);

  return {
    title,
    description,
    alternates: { canonical: `/ai-soc-prep/module/${slug}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = moduleBySlug(slug);
  if (!m) notFound();

  return <AiSocModulePage module={m} />;
}
