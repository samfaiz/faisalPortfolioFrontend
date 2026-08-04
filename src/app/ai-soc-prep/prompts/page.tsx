import Link from "next/link";
import type { Metadata } from "next";

const title = "Prompt library — AI SOC Analyst";
const description =
  "Tested, copy-paste prompts for a SOC: alert triage, phishing analysis, log summarisation, entity timeline, KQL/SPL generation, YARA and Sigma drafting, incident report, executive summary. Each with its purpose, output schema, known failure modes and a version.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/prompts" },
  openGraph: { title, description, type: "article" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * The page people bookmark. Each prompt carries the fields module 04 argues a
 * prompt needs: purpose, input format, output schema, known failure modes, and
 * a version — because a prompt is a detection rule, and a bare prompt with no
 * failure modes is a rule with no documentation.
 */
interface Prompt {
  id: string;
  title: string;
  version: string;
  purpose: string;
  input: string;
  schema: string;
  prompt: string;
  failures: string[];
  module?: { n: number; slug: string };
}

const PROMPTS: Prompt[] = [
  {
    id: "triage",
    title: "Alert triage",
    version: "v2",
    purpose:
      "Turn one normalised alert bundle into a grounded verdict an analyst can check. The base prompt of the whole path.",
    input: "A normalised event bundle (module 08). One entity, relevant events only.",
    schema: "verdict, confidence, evidence[{claim, source_line}], recommended_next_steps[], unsupported_observations[]",
    prompt:
      "You are a Tier-1 triage assistant. You do not close alerts; you prepare them for an analyst who does.\n\nFor every item in `evidence`, `source_line` MUST be copied EXACTLY from the INPUT. Do not paraphrase, reformat or tidy it.\n\nIf you cannot support a claim with an exact line, do not make the claim — put it in `unsupported_observations` instead.\n\nIf fewer than two claims can be evidenced, set verdict to `insufficient_evidence` and return an empty evidence array.\n\nconfidence is a decimal between 0 and 1, on this scale:\n  0.9–1.0  multiple independent pieces of evidence agree\n  0.7–0.9  clear evidence, one plausible benign explanation remains\n  0.4–0.7  suggestive, materially incomplete\n  below 0.4  return insufficient_evidence",
    failures: [
      "Paraphrases the log line instead of quoting it — the grounding validator must reject this, not the prompt alone.",
      "Returns confidence as 85 rather than 0.85 — add the decimal instruction and let the schema catch the rest.",
      "Over-uses insufficient_evidence on smaller models — loosen the two-claim threshold to one and observe.",
    ],
    module: { n: 4, slug: "prompt-engineering" },
  },
  {
    id: "phishing",
    title: "Phishing email interpretation",
    version: "v1",
    purpose:
      "Interpret an evidence bundle that DETERMINISTIC code already extracted from an .eml — never re-derive the facts.",
    input: "A parsed bundle: real vs displayed sender, SPF/DKIM/DMARC results with alignment, defanged URLs, attachment hashes.",
    schema: "verdict, confidence, evidence[{claim, bundle_field}], analyst_notes[]",
    prompt:
      "You interpret a phishing evidence bundle that has ALREADY been parsed by code. You do NOT re-derive SPF, DKIM, DMARC or alignment — those values are given; trust them.\n\nExplain what the parsed evidence means. Every claim must cite the exact bundle field it rests on. Pay special attention to authentication that passed on a domain OTHER than the visible From: domain — that is the classic unaligned-pass trick.\n\nDo not resolve, fetch or expand any URL. If the bundle is insufficient to judge, say so.",
    failures: [
      "Contradicts the header by re-deriving SPF — the prompt forbids it, but weak models still try; validate against the bundle.",
      "Treats an unaligned DKIM pass as safe — emphasise alignment, not just pass/fail.",
      "Adds risk from the body wording — steer it to the parsed fields, since content is the weakest signal (module 14).",
    ],
    module: { n: 4, slug: "prompt-engineering" },
  },
  {
    id: "timeline",
    title: "Entity timeline summarisation",
    version: "v1",
    purpose:
      "Summarise a chronological, multi-source timeline the QUERY already assembled — reading, not chronology inference.",
    input: "An ordered timeline for one entity (module 09's timeline query output).",
    schema: "summary, key_moments[{ts, what, why_it_matters}], gaps[]",
    prompt:
      "You summarise a pre-assembled entity timeline. The chronology is already correct — do NOT reorder or infer sequence.\n\nProduce a short narrative and the key moments. For anything the timeline does not explain — a jump the entries do not bridge — add it to `gaps`. Never invent an event to make the story flow; a stated gap is more valuable than a smooth guess.",
    failures: [
      "Invents a bridge for a gap ('the attacker likely used stolen credentials') — force gaps into the gaps list.",
      "Reorders events by assumed causality — reinforce that the timeline is authoritative.",
    ],
    module: { n: 9, slug: "triage-assist" },
  },
  {
    id: "kql",
    title: "NL → KQL / SPL, schema-grounded",
    version: "v2",
    purpose:
      "Generate a query grounded in the REAL schema, for a human to validate — never to blind-execute.",
    input: "The hunt idea in plain English, plus the actual table/column list.",
    schema: "status(ok|needs_missing_field), table, kql, missing[]",
    prompt:
      "You write KQL for Microsoft Sentinel using ONLY the schema provided. Target exactly one table. Always bound time with `where TimeGenerated > ago(...)`.\n\nIf the request needs a field that is not in the schema, set status to `needs_missing_field` and list it — do NOT invent a column. A plausible-but-wrong field returns zero rows in Sentinel, which reads as 'nothing found', so inventing one is the worst outcome.\n\n[PASTE THE SCHEMA: table names and their columns]",
    failures: [
      "Invents a column that reads well (SourceIP, ProcessName) — the static field check must catch it before running.",
      "Omits the time bound — a syntax check for ago() rejects it and regenerates.",
      "Joins two tables when told to use one — keep it single-table and validate against one schema.",
    ],
    module: { n: 10, slug: "nl-to-detection" },
  },
  {
    id: "deobfuscate",
    title: "Script deobfuscation (analysis only)",
    version: "v1",
    purpose:
      "Deobfuscate a captured PowerShell/JS/VBA script and extract IOCs — the one place LLMs genuinely excel, still verified.",
    input: "The raw obfuscated script text, from a macro dump or captured command line.",
    schema: "decoded_intent, techniques[], iocs[{value, kind}] (all DEFANGED)",
    prompt:
      "You are a malware analyst. Deobfuscate the script below. Do NOT execute it, describe execution, or emit runnable code.\n\nReturn: (1) the decoded intent in plain English, (2) each obfuscation technique used, (3) every URL, domain, IP and path — DEFANGED (hxxp, [.]).\n\nFor every claim, quote the exact line from the input it came from. If you cannot decode a section, say so — do not guess.",
    failures: [
      "Mis-decodes an unusual encoding confidently — verify every extracted IOC against the raw/self-decoded bytes (project 06).",
      "Emits a runnable reconstruction — the prompt forbids it; strip any executable output.",
      "Invents an IOC not present once decoded — reject any IOC you cannot reproduce.",
    ],
    module: { n: 11, slug: "static-triage" },
  },
  {
    id: "yara",
    title: "YARA rule draft",
    version: "v1",
    purpose:
      "Draft a YARA rule from CONFIRMED strings — for a goodware scan to gate, never to deploy as-is.",
    input: "The confirmed strings (verified present in the sample), and the sha256.",
    schema: "A YARA rule with meta(sha256), strings, and a multi-string condition.",
    prompt:
      "Write a YARA rule using ONLY the confirmed strings provided. Prefer specific, long strings over short generic ones. Include a meta section with the sha256. The condition should require SEVERAL strings, not any single one.\n\nDo not add strings that are not in the confirmed list.",
    failures: [
      "Keys on a short/common string that also matches Notepad — the goodware scan against System32 must reject it.",
      "Uses a single-string condition — require N-of-them so a variant does not slip and goodware does not hit.",
    ],
    module: { n: 11, slug: "static-triage" },
  },
  {
    id: "sigma",
    title: "Sigma rule draft (experimental)",
    version: "v1",
    purpose:
      "Draft a Sigma rule from VERIFIED observed behaviour — experimental until a backtest measures its fire rate.",
    input: "A verified ATT&CK map and the observed process behaviour from a sandbox report.",
    schema: "A Sigma YAML rule, status: experimental, backtest fields blank.",
    prompt:
      "Draft a Sigma rule from the verified behaviours provided. Use standard Sigma fields. Key on the STRONGEST observed behaviour — prefer process lineage and command patterns over IOCs, which age out in days.\n\nSet status: experimental and leave backtest.fires_per_day blank — the rule is not deployable until it is measured. Tag only with the techniques in the verified map.",
    failures: [
      "Keys on a domain that rotates daily — steer it to behaviour, not infrastructure.",
      "Marks itself production — force status: experimental with blank backtest fields until measured (module 10).",
    ],
    module: { n: 12, slug: "dynamic-and-re" },
  },
  {
    id: "report",
    title: "Incident writeup (grounded, audited)",
    version: "v1",
    purpose:
      "Draft a technical writeup and executive summary from a VERIFIED timeline — every claim traced, gaps stated.",
    input: "A structured, verified incident timeline with entry ids.",
    schema: "narrative[{text, entry_ids}], gaps[], indicators[]  +  exec summary",
    prompt:
      "Write a technical incident writeup using ONLY the timeline entries. Every claim's entry_ids MUST reference real ids that support it. Do NOT invent events, times or hosts.\n\nIf the timeline does not explain a transition, add it to `gaps` — never bridge a gap with an assumed event.\n\nFor the executive summary: plain language, no event IDs, covering impact, scope, status and next steps — same facts, higher altitude, no new facts.",
    failures: [
      "Bridges a timeline gap with a plausible invention — the grounding validator flags any claim its entry_ids do not support.",
      "Exec summary contradicts the technical report — generate BOTH from the timeline, never one from the other.",
      "Reviewer field left as 'AI' — it must be a named human; block publishing until it is (module 05).",
    ],
    module: { n: 5, slug: "data-governance" },
  },
];

function PromptCard({ p }: { p: Prompt }) {
  return (
    <li
      id={p.id}
      className="scroll-mt-24 overflow-hidden rounded-lg border-[1.5px] border-hairline bg-surface"
    >
      <div className="border-b border-hairline px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-[19px] font-bold tracking-[-0.02em]">
            {p.title}
          </h2>
          <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
            {p.version}
          </span>
          {p.module && (
            <Link
              href={`/ai-soc-prep/module/${p.module.slug}`}
              className="mono-label ml-auto text-faint transition-colors hover:text-accent-strong"
            >
              MODULE {String(p.module.n).padStart(2, "0")} →
            </Link>
          )}
        </div>
        <p className="mt-2 max-w-(--soc-measure) text-[14px] leading-relaxed text-muted-2">
          {p.purpose}
        </p>
      </div>

      <div className="grid gap-px bg-hairline sm:grid-cols-2">
        <div className="bg-surface px-5 py-3">
          <span className="mono-label mb-1 block text-accent-strong">INPUT</span>
          <p className="text-[13px] leading-relaxed text-muted-2">{p.input}</p>
        </div>
        <div className="bg-surface px-5 py-3">
          <span className="mono-label mb-1 block text-accent-strong">
            OUTPUT SCHEMA
          </span>
          <p className="font-mono text-[12px] leading-relaxed text-muted-2">
            {p.schema}
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        <span className="mono-label mb-2 block text-accent-strong">THE PROMPT</span>
        <pre className="overflow-x-auto rounded-md border border-hairline bg-surface-alt px-3.5 py-3 font-mono text-[12.5px] leading-[1.7] text-ink">
          {p.prompt}
        </pre>
      </div>

      <div className="border-t border-hairline px-5 py-4">
        <span className="mono-label mb-2 block text-(--ai-unverified)">
          KNOWN FAILURE MODES
        </span>
        <ul className="space-y-1.5">
          {p.failures.map((f, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-muted-2">
              <span aria-hidden className="text-(--ai-unverified)">
                ▸
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export default function PromptsPage() {
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
          <span className="mono-label text-accent-strong">{PROMPTS.length} PROMPTS</span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Prompt library
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            Copy-paste prompts for real SOC work. Each carries what module 04 says
            a prompt needs — purpose, input, output schema,{" "}
            <b className="font-medium text-ink">known failure modes</b> and a
            version — because a prompt is a detection rule, and a bare prompt is a
            rule with no documentation.
          </p>
          <p className="mt-3 max-w-(--soc-measure) font-mono text-[12.5px] leading-[1.7] text-muted-2">
            {
              "// None of these are magic. Every one has failure modes, and the grounding validator — not the prompt — is what makes the output trustworthy."
            }
          </p>
        </header>

        <ol className="mt-10 space-y-5">
          {PROMPTS.map((p) => (
            <PromptCard key={p.id} p={p} />
          ))}
        </ol>
      </div>
    </div>
  );
}
