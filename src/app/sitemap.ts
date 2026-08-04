import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { CLOUD_GUIDES } from "@/lib/cloud-prep/guides";
import { SOC_GUIDES } from "@/lib/soc-prep/guides";
import { MODULES as AI_SOC_MODULES } from "@/lib/ai-soc-prep/data";
import { AI_SOC_GUIDES } from "@/lib/ai-soc-prep/projects";

const SITE = "https://faisalkhan.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([api.projects(), api.posts()]);

  const staticRoutes = ["", "/about", "/projects", "/experience", "/blog", "/soc-prep", "/cloud-security-prep", "/seo-prep", "/ai-soc-prep", "/ai-soc-prep/when-not-to-use-ai", "/ai-soc-prep/datasets", "/ai-soc-prep/projects", "/ai-soc-prep/quiz", "/ai-soc-prep/prompts", "/ai-soc-prep/cost", "/ai-soc-prep/glossary", "/ai-soc-prep/careers", "/ai-soc-prep/resources", "/ai-soc-prep/lab-safety"].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
  }));

  const postRoutes = posts.map((p) => ({
    url: `${SITE}/blog/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : new Date(),
  }));

  const projectRoutes = projects.map((p) => ({
    url: `${SITE}/projects/${p.slug}`,
    lastModified: new Date(),
  }));

  // One entry per project walkthrough. These are the deepest pages on the
  // site and the ones most likely to be found by search, so they belong here
  // rather than relying on discovery through the kit pages.
  const guideRoutes = [
    ...AI_SOC_MODULES.map((m) => `/ai-soc-prep/module/${m.slug}`),
    ...AI_SOC_GUIDES.map((g) => `/ai-soc-prep/projects/${g.slug}`),
    ...SOC_GUIDES.map((g) => `/soc-prep/projects/${g.slug}`),
    ...CLOUD_GUIDES.map((g) => `/cloud-security-prep/projects/${g.slug}`),
  ].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...guideRoutes, ...postRoutes, ...projectRoutes];
}
