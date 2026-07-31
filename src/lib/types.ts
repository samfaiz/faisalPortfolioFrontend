/**
 * API response types — mirror docs/API_CONTRACT.md (v1).
 * The Laravel backend (owned by the parallel worker) serves these shapes.
 */
import type { Seo } from "./seo";

export interface MediaRef {
  id?: number;
  url: string;
  alt?: string;
}

export interface Cta {
  label: string;
  href: string;
}

/** Category slugs come from the CMS now, so this is any string plus "all". */
export type ProjectCategory = "all" | (string & {});

export interface ProjectCategoryOption {
  slug: string;
  label: string;
}
export type PostCategory = "all" | "security" | "ai-dev" | "ctf";

/** One step of a lab walkthrough: what was done, the screenshot, the artefact. */
export interface CaseStudyStep {
  title: string;
  body: string;
  image: string | null;
  caption?: string | null;
  /** The actual query, command, or log line behind the screenshot. */
  evidence?: { lang?: string | null; code: string } | null;
}

/**
 * Set on projects with nothing to render live — lab work, where the story is
 * the sequence rather than a single view. Its presence is what switches the
 * project page from the live viewer to the walkthrough.
 */
export interface CaseStudy {
  objective?: string | null;
  stack: string[];
  steps: CaseStudyStep[];
  outcome?: string | null;
  /** Slug of the matching prep-kit walkthrough, if one was written. */
  guide_slug?: string | null;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  /** Rich text for the project page body. Plain description stays for cards + SEO. */
  body_html?: string | null;
  url: string | null;
  repo_url?: string | null;
  allow_iframe: boolean;
  preview_video?: string | null;
  preview_image?: string | null;
  hero_image?: string | null;
  /** Hero doubles as the grid card image and the social preview. */
  hero_is_display?: boolean;
  case_study?: CaseStudy | null;
  tags: string[];
  thumbnail?: MediaRef | null;
  featured: boolean;
  order: number;
  seo?: Seo | null;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  category: Exclude<PostCategory, "all">;
  excerpt: string;
  body_html?: string;
  read_minutes: number;
  featured: boolean;
  cover?: MediaRef | null;
  published_at: string | null;
  author?: { name: string };
  seo?: Seo | null;
}

export interface Experience {
  id: number;
  role: string;
  company: string;
  date_label: string;
  current: boolean;
  summary: string;
  order: number;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  year: string;
  status: "done" | "in-progress";
  thumbnail?: MediaRef | null;
  order: number;
}

export interface Stats {
  years_in_security: number;
  incidents_handled: number;
  apps_shipped_with_ai: number;
  status: string;
}

/** Singleton page sections (JSON payloads). Loosely typed per-key. */
export interface HeroSection {
  boot_line: string;
  /** Optional link target for the boot line (e.g. a blog post) — editable. */
  boot_line_url?: string | null;
  status_pill: string;
  name: string;
  tagline: string;
  photo?: MediaRef | null;
  headline_line1: string;
  headline_line2: string;
  footnote: string[];
  cta_primary: Cta;
  cta_secondary: Cta;
}

export interface SiteSection {
  wordmark: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  location: string;
  logo?: string | null;
  tagline?: string | null;
}

/** Home "about" teaser — editable section `home_about`. */
export interface AboutSection {
  eyebrow: string;
  heading: string;
  body: string;
  facts: { label: string; value: string; accent?: boolean }[];
}

/** A single skills column. */
export interface SkillGroup {
  label: string;
  dot: string;
  tinted?: boolean;
  items: string[];
}

/** Home "what I do" grid — editable section `home_skills`. */
export interface SkillsSection {
  title: string;
  groups: SkillGroup[];
}

/** Public site settings (theme default, logo, SEO defaults) — GET /settings. */
export interface SiteSettings {
  theme: { default: "system" | "light" | "dark"; accent: string | null };
  seo: {
    title_suffix: string;
    robots_default: string;
    sitemap_enabled: boolean;
  };
  logo: string | null;
  og_image: string | null;
  /** Resume: view opens the PDF inline; download forces a file download. */
  resume_url: string | null;
  resume_download: string | null;
}
