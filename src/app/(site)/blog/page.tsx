import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { BlogList } from "@/components/blog-list";
import { JsonLd } from "@/components/json-ld";
import { api } from "@/lib/api";
import { buildMetadata, faqJsonLd, fetchPageSeo } from "@/lib/seo";

const fallbackMeta = {
  title: "Blog",
  description: "Notes from the field — security writeups, AI + development, and CTF walkthroughs.",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchPageSeo("blog");
  return buildMetadata(seo, fallbackMeta);
}

export default async function BlogPage() {
  const [posts, seo] = await Promise.all([api.posts(), fetchPageSeo("blog")]);
  const faq = faqJsonLd(seo?.faq);
  return (
    <>
      {seo?.json_ld?.length ? <JsonLd data={seo.json_ld} /> : null}
      {faq ? <JsonLd data={faq} /> : null}
      <PageHeader line1="NOTES FROM" line2="THE FIELD." breadcrumb="~/blog" />
      <section className="px-4 py-10 sm:px-5">
        <div className="mx-auto max-w-6xl">
          <BlogList posts={posts} />
        </div>
      </section>
    </>
  );
}
