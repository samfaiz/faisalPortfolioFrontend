import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, faqJsonLd } from "@/lib/seo";

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await api.post(slug);
  if (!post) return { title: "Post not found" };
  return buildMetadata(post.seo ?? null, { title: post.title, description: post.excerpt });
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await api.post(slug);
  if (!post) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    author: { "@type": "Person", name: post.author?.name ?? "Faisal Khan" },
  };
  const faq = faqJsonLd(post.seo?.faq);
  const jsonLd = [
    articleLd,
    ...(post.seo?.json_ld ?? []),
    ...(faq ? [faq] : []),
  ];

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

        <div className="mt-8 border-t border-divider pt-8 text-[15px] leading-[1.85] text-muted">
          {post.body_html ? (
            <div dangerouslySetInnerHTML={{ __html: post.body_html }} />
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
