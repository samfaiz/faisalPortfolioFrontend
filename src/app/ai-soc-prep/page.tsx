import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { AiSocPrepKit } from "@/components/ai-soc-prep/kit";
import { MODULES, MODULE_COUNT } from "@/lib/ai-soc-prep/data";

const title = "AI SOC Analyst — Learning Path";
const description = `A ${MODULE_COUNT}-module path on using AI in a SOC as an evidence-processing layer a human stays accountable for. Local models, public datasets, every project reproducible — covering triage assist, NL→KQL/SPL, malware triage, defending LLM applications, and detecting AI-enabled attacks.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

/** Course structured data — the path is a genuine curriculum, so say so. */
const courseJsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: title,
  description,
  provider: { "@type": "Person", name: "Faisal Khan" },
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseWorkload: `PT${Math.round(
      MODULES.reduce((n, m) => n + m.minutes, 0) / 60
    )}H`,
  },
  syllabusSections: MODULES.map((m) => ({
    "@type": "Syllabus",
    name: `Module ${m.n}: ${m.title}`,
    description: m.summary,
  })),
};

export default function AiSocPrepPage() {
  return (
    <>
      <JsonLd data={courseJsonLd} />
      <AiSocPrepKit />
    </>
  );
}
