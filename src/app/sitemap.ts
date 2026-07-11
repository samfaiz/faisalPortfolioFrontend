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

  // Projects are showcased on /projects; include their slugs as anchors is not
  // meaningful for crawlers, so we only expose the section pages + posts.
  void projects;

  return [...staticRoutes, ...postRoutes];
}
