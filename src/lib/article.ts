/**
 * Article helpers for the blog — turn the CMS body HTML into something that
 * reads well and ranks/cites well: a table of contents with anchor links, and
 * rich schema.org JSON-LD (Article + Breadcrumb) for search and AI answer
 * engines. Keeps the blog post page component lean.
 */
import type { Post } from "./types";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "section"
  );
}

/**
 * Inject stable `id`s into every <h2> and <h3> and collect them as a table of
 * contents, so headings are linkable and a nested TOC can render. De-dupes
 * repeated headings.
 */
export function enrichArticle(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const seen = new Set<string>();

  const out = html.replace(
    /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    (_m, tag: string, attrs: string | undefined, inner: string) => {
      const level = tag === "3" ? 3 : 2;
      const text = inner.replace(/<[^>]+>/g, "").trim();
      if (!text) return `<h${tag}${attrs ?? ""}>${inner}</h${tag}>`;

      const base = slugify(text);
      let id = base;
      let n = 2;
      while (seen.has(id)) id = `${base}-${n++}`;
      seen.add(id);
      toc.push({ id, text, level });

      const cleaned = (attrs ?? "").replace(/\sid=("[^"]*"|'[^']*')/i, "");
      return `<h${tag}${cleaned} id="${id}">${inner}</h${tag}>`;
    },
  );

  return { html: out, toc };
}

function wordCount(html?: string): number | undefined {
  if (!html) return undefined;
  const n = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return n || undefined;
}

/** schema.org Article — the primary structured data for a blog post. */
export function articleJsonLd(
  post: Post,
  opts: { url: string; siteUrl: string; image?: string | null },
): Record<string, unknown> {
  const authorName = post.author?.name ?? "Faisal Khan";
  const words = wordCount(post.body_html);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    ...(post.published_at ? { datePublished: post.published_at, dateModified: post.published_at } : {}),
    author: {
      "@type": "Person",
      name: authorName,
      jobTitle: "Cyber Security Analyst",
      url: opts.siteUrl,
    },
    publisher: { "@type": "Person", name: "Faisal Khan", url: opts.siteUrl },
    ...(opts.image ? { image: opts.image } : {}),
    articleSection: post.category,
    ...(post.seo?.keywords?.length ? { keywords: post.seo.keywords.join(", ") } : {}),
    ...(words ? { wordCount: words } : {}),
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    url: opts.url,
  };
}

/** schema.org BreadcrumbList — Blog → this post. */
export function breadcrumbJsonLd(post: Post, siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 2, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
    ],
  };
}
