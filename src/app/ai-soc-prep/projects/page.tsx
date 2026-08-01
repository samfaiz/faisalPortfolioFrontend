import Link from "next/link";
import type { Metadata } from "next";
import {
  AI_SOC_PROJECTS,
  AI_SOC_PROJECTS_BUILT,
  AI_SOC_PROJECT_COUNT,
  type AiSocProject,
} from "@/lib/ai-soc-prep/projects";
import { moduleByNumber } from "@/lib/ai-soc-prep/data";

const title = "Projects — AI SOC Analyst";
const description = `Ten hands-on projects, from a local model returning its first structured verdict to an eval harness that measures precision and hallucination rate. ${AI_SOC_PROJECTS_BUILT} built so far.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/projects" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * The remaining nine, from the plan. Listed rather than hidden: a reader
 * deciding whether to start should see where the path goes, and the capstone
 * is the reason to start at all.
 */
const PLANNED: { n: number; title: string; note: string; difficulty: string }[] = [
  { n: 2, title: "Phishing email analyzer", difficulty: "Beginner", note: "EML → headers, SPF/DKIM, URLs, attachments → verdict + analyst report. Header analysis is deterministic code; only the interpretation is AI." },
  { n: 3, title: "Windows auth log anomaly hunter", difficulty: "Intermediate", note: "4624/4625/4648 baselining, embedding clustering, then an AI narrative. Proves AI is not the whole pipeline." },
  { n: 4, title: "Alert triage copilot with RAG", difficulty: "Intermediate", note: "Runbook corpus → vector store → grounded verdicts with citations." },
  { n: 5, title: "NL→KQL assistant with validator", difficulty: "Intermediate", note: "Schema-grounded generation that refuses to run unvalidated output. The validator is the point, not the generation." },
  { n: 6, title: "Malware static triage assistant", difficulty: "Intermediate", note: "CAPA/FLOSS/strings/PE → structured report → YARA draft → false-positive check against goodware." },
  { n: 7, title: "Sandbox report → Sigma generator", difficulty: "Intermediate", note: "Report → IOCs → ATT&CK map → Sigma rule → backtest. Chains three AI steps and shows error compounding." },
  { n: 8, title: "MCP SOC agent with approval gate", difficulty: "Advanced", note: "An agent with VirusTotal, AbuseIPDB and log-query tools, and a human approval on every action with side effects." },
  { n: 9, title: "AI incident report writer", difficulty: "Intermediate", note: "Timeline in, exec summary and technical writeup out, with the audit-trail fields from module 05." },
  { n: 10, title: "Eval harness", difficulty: "Advanced", note: "50-alert golden dataset, precision/recall/hallucination measurement, prompt A/B. Nobody builds this — it turns “I made a chatbot” into “I engineered and measured a system”." },
];

function BuiltCard({ p }: { p: AiSocProject }) {
  return (
    <li className="rounded-lg border-[1.5px] border-hairline bg-surface px-5 py-5 transition-colors hover:border-ink">
      <Link href={`/ai-soc-prep/projects/${p.slug}`} className="group block">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono-label text-accent-strong">
            PROJECT {String(p.n).padStart(2, "0")}
          </span>
          <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
            {p.difficulty.toUpperCase()}
          </span>
          <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
            {p.hours}
          </span>
        </div>

        <h2 className="mt-2 font-display text-[19px] font-bold tracking-[-0.02em] transition-colors group-hover:text-accent-strong">
          {p.title}
        </h2>
        <p className="mt-1.5 max-w-(--soc-measure) text-[14px] leading-relaxed text-muted-2">
          {p.tagline}
        </p>
      </Link>

      {p.modules.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {p.modules.map((n) => {
            const m = moduleByNumber(n);
            return m ? (
              <Link
                key={n}
                href={`/ai-soc-prep/module/${m.slug}`}
                className="mono-label text-faint transition-colors hover:text-ink"
              >
                ← MODULE {String(n).padStart(2, "0")}
              </Link>
            ) : null;
          })}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.stack.map((t) => (
          <span
            key={t}
            className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-muted-2"
          >
            {t}
          </span>
        ))}
      </div>
    </li>
  );
}

export default function AiSocProjectsPage() {
  return (
    <div className="soc-page min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-225 px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        <Link
          href="/ai-soc-prep"
          className="mono-label soc-noprint inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
        >
          ← BACK TO AI SOC ANALYST
        </Link>

        <header className="mt-6 border-b-2 border-ink pb-7">
          <span className="mono-label text-accent-strong">
            {AI_SOC_PROJECTS_BUILT} OF {AI_SOC_PROJECT_COUNT} BUILT
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Projects
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            Every one runs locally on public data, so a stranger can reproduce it
            without a SIEM licence or an API key. Each carries an{" "}
            <b className="font-medium text-ink">enterprise variant</b> showing how
            the same job is done on a commercial platform.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="mono-label mb-4 flex items-center gap-3 text-accent-strong">
            AVAILABLE NOW
            <span aria-hidden className="h-px flex-1 bg-hairline" />
          </h2>
          <ul className="space-y-3">
            {AI_SOC_PROJECTS.filter((p) => p.built).map((p) => (
              <BuiltCard key={p.n} p={p} />
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="mono-label mb-1.5 flex items-center gap-3 text-faint">
            PLANNED
            <span aria-hidden className="h-px flex-1 bg-hairline" />
            <span>{PLANNED.length}</span>
          </h2>
          <p className="mb-4 max-w-(--soc-measure) font-mono text-[11.5px] leading-relaxed text-muted-2">
            {
              "// Listed rather than hidden — where the path goes matters when you are deciding whether to start it."
            }
          </p>
          <ul className="space-y-2">
            {PLANNED.map((p) => (
              <li
                key={p.n}
                className="rounded-md border border-dashed border-hairline bg-surface-alt px-4 py-3.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono-label text-faint">
                    PROJECT {String(p.n).padStart(2, "0")}
                  </span>
                  <span className="mono-label text-faint">
                    {p.difficulty.toUpperCase()}
                  </span>
                </div>
                <h3 className="mt-1 text-[15px] font-semibold text-ink">
                  {p.title}
                </h3>
                <p className="mt-1 max-w-(--soc-measure) text-[13.5px] leading-relaxed text-muted-2">
                  {p.note}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
