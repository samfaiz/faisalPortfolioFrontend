import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const SITE = "https://faisalkhan.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([api.projects(), api.posts()]);

  const staticRoutes = ["", "/about", "/projects", "/experience", "/blog"].map((path) => ({
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

  return [...staticRoutes, ...postRoutes, ...projectRoutes];
}
