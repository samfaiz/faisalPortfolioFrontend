import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SeoPrepKit } from "@/components/seo-prep/kit";
import { FUNDAMENTALS, FUNDAMENTAL_COUNT } from "@/lib/seo-prep/data";
import { RESOURCE_COUNT } from "@/lib/seo-prep/resources";

const title = "SEO Prep — Junior / Mid / Senior Interview Kit";
const description = `Free SEO interview prep kit, weighted towards technical SEO: ${FUNDAMENTAL_COUNT} fundamentals with plain-English explanations and real examples, tier-by-tier role expectations, and ${RESOURCE_COUNT} free resources. Every tool used is free.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/seo-prep" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const stripHtml = (h: string) =>
  h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** FAQPage structured data from the fundamentals — plain-English answer first,
 *  then the depth. Practising what the kit preaches. */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FUNDAMENTALS.map((f) => ({
    "@type": "Question",
    name: f.title,
    acceptedAnswer: {
      "@type": "Answer",
      text: stripHtml([f.plain, f.detail].join(" ")),
    },
  })),
};

export default function SeoPrepPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <SeoPrepKit />
    </>
  );
}
