/**
 * Typed API client for the Laravel CMS (docs/API_CONTRACT.md, v1).
 *
 * Every getter fetches from the backend and falls back to bundled seed data
 * (lib/fallback.ts) if the API is unreachable or errors — so the site renders
 * fully during Phase 1 while the backend (parallel worker) is still in progress.
 */
import * as fallback from "./fallback";
import type {
  AboutSection,
  Certification,
  Experience,
  HeroSection,
  Post,
  Project,
  SiteSection,
  SiteSettings,
  SkillGroup,
  SkillsSection,
  Stats,
} from "./types";

/** Sensible defaults if the settings endpoint is unreachable. */
const settingsFallback: SiteSettings = {
  theme: { default: "system", accent: null },
  seo: { title_suffix: "— Faisal Khan", robots_default: "index,follow", sitemap_enabled: true },
  logo: null,
  og_image: null,
  resume_url: null,
  resume_download: null,
};

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

/**
 * Resolve a stored upload path to a servable URL. Goes through the app's media
 * endpoint (not /storage) because nginx won't serve the storage symlink. Real
 * URLs pass through unchanged.
 */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith("//")) return path;
  const clean = path.replace(/^\/?(storage\/)?/, "");
  return `${BASE}/media?path=${encodeURIComponent(clean)}`;
}

/** Fetch JSON from the API; return `fb` on any failure. Cached + revalidated. */
async function get<T>(path: string, fb: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: "application/json" },
      // ISR: revalidate every 60s in production; the backend can also trigger
      // on-demand revalidation via a webhook on publish (Phase 2).
      next: { revalidate: 60 },
    });
    if (!res.ok) return fb;
    return (await res.json()) as T;
  } catch {
    return fb;
  }
}

export const api = {
  site: () => get<SiteSection>("/sections/site", fallback.site),
  hero: () => get<HeroSection>("/sections/home_hero", fallback.hero),
  about: () => get<AboutSection>("/sections/home_about", fallback.aboutIntro as AboutSection),
  skills: () =>
    get<SkillsSection>("/sections/home_skills", {
      title: "What I do",
      groups: fallback.skills as SkillGroup[],
    }),
  projects: () => get<Project[]>("/projects", fallback.projects),
  project: (slug: string) =>
    get<Project | null>(`/projects/${slug}`, fallback.projects.find((p) => p.slug === slug) ?? null),
  posts: () => get<Post[]>("/posts", fallback.posts),
  post: (slug: string) =>
    get<Post | null>(`/posts/${slug}`, fallback.posts.find((p) => p.slug === slug) ?? null),
  experiences: () => get<Experience[]>("/experiences", fallback.experiences),
  certifications: () => get<Certification[]>("/certifications", fallback.certifications),
  stats: () => get<Stats>("/stats", fallback.stats),
  settings: () => get<SiteSettings>("/settings", settingsFallback),
  aboutPage: () => get<{ photo?: string | null }>("/sections/about", { photo: null }),
};

export { fallback };
