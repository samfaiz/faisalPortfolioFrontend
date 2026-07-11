/**
 * AI SEO helpers — fetch per-page SEO from the Laravel CMS and map it to
 * Next.js `Metadata`, with graceful fallback to the page's static metadata.
 *
 * Contract: `GET /seo/page/{key}` returns a `Seo` object (or null / {}) — see
 * SeoMeta::toApi() on the backend. Page keys: home, about, projects,
 * experience, blog. Post SEO ships on the post detail response (`post.seo`).
 */
import type { Metadata } from "next";

export interface Seo {
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  canonical: string | null;
  og: { title?: string; description?: string; image?: string } | Record<string, never>;
  robots: string; // e.g. "index,follow"
  json_ld: Record<string, unknown>[]; // array of JSON-LD objects (may be empty)
  faq: { q: string; a: string }[]; // may be empty
  ai_generated: boolean;
  score: number | null;
}

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

/**
 * Fetch page-level SEO. Returns `null` on any failure, or when the backend has
 * no SEO for the key (null / empty object) — callers then fall back to static.
 */
export async function fetchPageSeo(key: string): Promise<Seo | null> {
  try {
    const res = await fetch(`${BASE}/seo/page/${key}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Seo | null;
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Map a `Seo` object (or null) to Next.js `Metadata`, using `fallback` text
 * whenever a field is missing. Safe to call with `null`.
 */
export function buildMetadata(
  seo: Seo | null,
  fallback: { title: string; description: string },
): Metadata {
  const title = seo?.meta_title || fallback.title;
  const description = seo?.meta_description || fallback.description;

  // A CMS meta_title is a complete, authored title — render it verbatim
  // (absolute) so the layout's "%s — Faisal Khan" template doesn't double the
  // brand. Short static fallbacks still flow through the template.
  const metadata: Metadata = {
    title: seo?.meta_title ? { absolute: seo.meta_title } : fallback.title,
    description,
  };

  if (seo?.keywords?.length) {
    metadata.keywords = seo.keywords.join(", ");
  }

  if (seo?.canonical) {
    metadata.alternates = { canonical: seo.canonical };
  }

  if (seo?.robots) {
    metadata.robots = {
      index: !seo.robots.includes("noindex"),
      follow: !seo.robots.includes("nofollow"),
    };
  }

  const og = (seo?.og ?? {}) as { title?: string; description?: string; image?: string };
  metadata.openGraph = {
    title: og.title || title,
    description: og.description || description,
    ...(og.image ? { images: [og.image] } : {}),
  };

  return metadata;
}

/**
 * Build a schema.org `FAQPage` JSON-LD object from a list of Q&A pairs.
 * Returns `null` when there are no entries (so callers can skip rendering).
 */
export function faqJsonLd(
  faq: { q: string; a: string }[] | undefined | null,
): Record<string, unknown> | null {
  if (!faq?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
