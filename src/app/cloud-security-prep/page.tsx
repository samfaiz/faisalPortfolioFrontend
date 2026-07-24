import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { CloudPrepKit } from "@/components/cloud-prep/kit";
import {
  ATTACK_PATHS,
  FUNDAMENTALS,
  RESOURCE_COUNT,
  SCENARIOS,
} from "@/lib/cloud-prep/data";
import { CLOUD_MCQ_COUNT } from "@/lib/cloud-prep/mcq";

const title = "Cloud Security Prep — AWS / Azure / GCP Interview Kit";
const description = `Free multi-cloud security interview prep across AWS, Azure, and GCP: ${FUNDAMENTALS.length} fundamentals, ${SCENARIOS.length} STAR scenarios, ${ATTACK_PATHS.length} attack paths, the ATT&CK cloud matrix, hardening playbooks, a ${CLOUD_MCQ_COUNT}-question quiz, and ${RESOURCE_COUNT} free resources — by seniority (Associate/Engineer/Architect) and aligned to AWS SCS, AZ-500, GCP PCSE, and CCSP.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/cloud-security-prep" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const stripHtml = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FUNDAMENTALS.map((f) => ({
    "@type": "Question",
    name: f.title,
    acceptedAnswer: { "@type": "Answer", text: stripHtml(f.concept) },
  })),
};

export default function CloudSecurityPrepPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <CloudPrepKit />
    </>
  );
}
