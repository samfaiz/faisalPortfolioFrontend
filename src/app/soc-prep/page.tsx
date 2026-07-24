import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SocPrepKit } from "@/components/soc-prep/kit";
import {
  FUNDAMENTALS,
  MALWARE,
  RESOURCE_COUNT,
  SCENARIOS,
} from "@/lib/soc-prep/data";
import { FUNDAMENTAL_EXTRAS } from "@/lib/soc-prep/extras";
import { MCQ_COUNT } from "@/lib/soc-prep/mcq";

const title = "SOC Analyst Prep — L1 / L2 / L3 Interview Kit";
const description = `Free SOC analyst interview prep kit: ${FUNDAMENTALS.length} fundamentals, ${SCENARIOS.length} STAR incident-response scenarios, ${MALWARE.length} malware-analysis topics, a ${MCQ_COUNT}-question practice quiz, tier-by-tier responsibilities, and ${RESOURCE_COUNT} free resources.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/soc-prep" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const stripHtml = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** FAQPage structured data from the fundamentals section (definition first,
 *  then the full answer). */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FUNDAMENTALS.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: stripHtml(
        [FUNDAMENTAL_EXTRAS[f.question]?.definition ?? "", f.answer].join(" ")
      ),
    },
  })),
};

export default function SocPrepPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <SocPrepKit />
    </>
  );
}
