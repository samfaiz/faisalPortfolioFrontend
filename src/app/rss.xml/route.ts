/**
 * /rss.xml — an RSS 2.0 feed of published blog posts, regenerated hourly.
 * Lets readers and aggregators subscribe to the blog.
 */
import { api } from "@/lib/api";

const SITE = "https://faisalkhan.dev";

export const revalidate = 3600;

/** Escape the five XML special characters for safe embedding in element text. */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const [site, posts] = await Promise.all([api.site(), api.posts()]);
  const brand = site.wordmark || "Faisal Khan";

  const items = posts
    .map((post) => {
      const link = `${SITE}/blog/${post.slug}`;
      const date = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString();
      return [
        "    <item>",
        `      <title>${xml(post.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${date}</pubDate>`,
        post.category ? `      <category>${xml(post.category)}</category>` : "",
        `      <description>${xml(post.excerpt || "")}</description>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(brand)} — Blog</title>
    <link>${SITE}/blog</link>
    <description>Writing on security, CTFs, and AI engineering by ${xml(brand)}.</description>
    <language>en</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(feed, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
