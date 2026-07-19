import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, faqJsonLd } from "@/lib/seo";
import { enrichArticle, articleJsonLd, breadcrumbJsonLd } from "@/lib/article";

const SITE_URL = "https://faisalkhan.dev";

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await api.post(slug);
  if (!post) return { title: "Post not found" };
  return buildMetadata(post.seo ?? null, {
    title: post.title,
    description: post.excerpt,
    image: mediaUrl(post.cover?.url ?? null),
  });
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await api.post(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = mediaUrl(post.cover?.url ?? null);
  const { html, toc } = enrichArticle(post.body_html ?? "");

  const faq = faqJsonLd(post.seo?.faq);
  const jsonLd = [
    articleJsonLd(post, { url, siteUrl: SITE_URL, image }),
    breadcrumbJsonLd(post, SITE_URL),
    ...(post.seo?.json_ld ?? []),
    ...(faq ? [faq] : []),
  ];

  const published = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const author = post.author?.name ?? "Faisal Khan";

  return (
    <article className="px-4 py-10 sm:px-5">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-3xl">
        <div className="mono-label flex items-center gap-1 text-muted-2">
          <Link href="/blog" className="hover:text-ink">~/blog</Link>
          <span>/{post.slug}</span>
        </div>

        <div className="mono-label mt-6 flex items-center gap-3 text-faint">
          <span className="text-accent-strong">{post.category.replace("-", "+").toUpperCase()}</span>
          <span>{post.read_minutes} MIN READ</span>
        </div>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] font-bold leading-tight tracking-[-0.03em]">
          {post.title}
        </h1>
        <p className="mt-4 text-[19px] leading-[1.7] text-muted">{post.excerpt}</p>

        {/* E-E-A-T byline: who wrote it, their authority, when */}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-divider pt-5 text-sm text-muted">
          <span className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent-strong">FK</span>
            <span className="font-medium text-ink">{author}</span>
          </span>
          <span className="text-faint">Cyber Security Analyst</span>
          {published && <span className="text-faint">· {published}</span>}
        </div>

        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={post.cover?.alt ?? post.title}
            className="mt-6 max-h-105 w-full rounded-lg border border-hairline object-cover"
          />
        )}

        {toc.length >= 3 && (
          <nav className="mt-8 rounded-lg border border-hairline bg-surface p-4">
            <div className="mono-label text-faint">ON THIS PAGE</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {toc.map((t) => (
                <li key={t.id} className={t.level === 3 ? "pl-4" : undefined}>
                  <a href={`#${t.id}`} className="text-muted transition-colors hover:text-accent-strong">
                    {t.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-8 border-t border-divider pt-8">
          {html ? (
            <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="mono-label text-faint">
              // full article content will be served from the CMS once published.
            </p>
          )}
        </div>

        <div className="mt-10">
          <Link href="/blog" className="mono-label rounded-pill border-[1.5px] border-ink px-4 py-2.5 text-ink transition-colors hover:bg-ink hover:text-paper">
            ← ALL POSTS
          </Link>
        </div>
      </div>
    </article>
  );
}
