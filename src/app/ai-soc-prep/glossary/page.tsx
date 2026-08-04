import Link from "next/link";
import type { Metadata } from "next";

const title = "Glossary — AI SOC Analyst";
const description =
  "Plain-English definitions of the jargon this path runs on: RAG, agent, embedding, grounding, hallucination, temperature, context window, MCP, guardrail, fine-tuning, inference, token, vector store, prompt injection — each with why a SOC analyst cares.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/glossary" },
  openGraph: { title, description, type: "article" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * The path is jargon-dense for SOC people. Each entry is a plain-English
 * definition plus one line on why it matters in this specific context — a bare
 * dictionary would be worth less.
 */
interface Term {
  term: string;
  plain: string;
  why: string;
  module?: { n: number; slug: string };
}

const TERMS: Term[] = [
  {
    term: "Token",
    plain:
      "The unit a model reads and writes — roughly a word-piece, so “PowerShell” might be two or three tokens. Everything a model does is counted in tokens.",
    why: "It is the currency of both cost and context. A raw log event is 400–600 tokens; normalised, about 60. That difference is why module 08 exists.",
    module: { n: 8, slug: "normalization" },
  },
  {
    term: "Context window",
    plain:
      "The maximum number of tokens a model can consider at once — the prompt, the retrieved documents and its own answer all share it.",
    why: "It is a fixed budget. Paste 40k log lines and you overflow it or crowd out the evidence that matters. You spend it on the most relevant, normalised events.",
    module: { n: 2, slug: "llm-mechanics" },
  },
  {
    term: "Temperature",
    plain:
      "A dial from 0 upward controlling randomness in the model's choices. At 0 it picks the most likely next token every time; higher values introduce variation.",
    why: "Triage verdicts run at temperature 0, because you want the same answer twice on the same input. Creativity is the wrong property for a verdict.",
    module: { n: 2, slug: "llm-mechanics" },
  },
  {
    term: "Inference",
    plain:
      "One run of the model — you send a prompt, it produces an output. Nothing is learned or stored; each inference is independent.",
    why: "Where the data goes matters: local inference keeps everything on your machine, hosted inference sends the prompt off-network. Module 05 governs which is allowed.",
    module: { n: 5, slug: "data-governance" },
  },
  {
    term: "Hallucination",
    plain:
      "When a model produces fluent, confident output that is simply false — an invented field, a citation to a line that does not exist, a capability the binary lacks.",
    why: "It is a technical property of how models work, not a bug awaiting a patch. The whole path is built to engineer around it — cite evidence, validate citations, keep a human gate.",
    module: { n: 2, slug: "llm-mechanics" },
  },
  {
    term: "Grounding",
    plain:
      "Requiring every claim to point at the specific evidence behind it — and checking that it really does. Here it means a citation must be a literal quote from the input.",
    why: "It turns a plausible sentence into a checkable finding. The grounding validator that rejects fabricated citations (project 01) is the base habit of the entire path.",
    module: { n: 4, slug: "prompt-engineering" },
  },
  {
    term: "Embedding",
    plain:
      "A list of numbers capturing the meaning of a piece of text, so similar meanings sit close together in vector space even when the words differ.",
    why: "It is how you search and cluster by meaning rather than keyword — deduplicating forty near-identical alerts (module 09) or retrieving the right runbook (project 04).",
    module: { n: 2, slug: "llm-mechanics" },
  },
  {
    term: "Vector store",
    plain:
      "A database built to hold embeddings and answer “which stored passages are closest in meaning to this query?” quickly. Chroma is the one used here.",
    why: "It is the retrieval half of RAG. You embed your runbooks into it once, then every triage query pulls the relevant passage from it in milliseconds.",
    module: { n: 7, slug: "build-your-own" },
  },
  {
    term: "RAG (retrieval-augmented generation)",
    plain:
      "Before the model answers, you search a document store for relevant passages and put them in the prompt. “The model reads your runbook before replying.”",
    why: "It replaces the model's generic memory with your actual procedures — and gives you a source to verify the answer against. It is not a truthfulness upgrade on its own.",
    module: { n: 9, slug: "triage-assist" },
  },
  {
    term: "Tool / function calling",
    plain:
      "The mechanism by which a model asks to run a named function with arguments, sees the result, and continues. The model never runs anything itself — your code does.",
    why: "It lets a model query the SIEM or look up a hash instead of guessing. Because your code executes the call, your code is where the approval gate lives.",
    module: { n: 7, slug: "build-your-own" },
  },
  {
    term: "Agent",
    plain:
      "A model in a loop with tools: it reads the situation, calls a tool, sees the result, and decides again, repeating until done.",
    why: "The loop makes it powerful and dangerous. Anything with a side effect needs a human approval gate, because prompt injection can turn the agent's tools against you (module 13, project 08).",
    module: { n: 2, slug: "llm-mechanics" },
  },
  {
    term: "MCP (Model Context Protocol)",
    plain:
      "A standard way to expose tools to a model, so a tool you build once works with any MCP-aware client. It separates “what the tool does” from “which model calls it”.",
    why: "SOC tools are the same everywhere — query the SIEM, check an IP. Building them once as MCP servers hedges against the vendor churn module 06 warns about.",
    module: { n: 7, slug: "build-your-own" },
  },
  {
    term: "Prompt injection",
    plain:
      "Malicious instructions that reach the model as text — either typed directly (direct) or planted in data the model reads, like a ticket or web page (indirect).",
    why: "Indirect injection is the one that matters: the attacker never touches your system, the payload rides in with the data, and the model cannot tell content from commands.",
    module: { n: 13, slug: "defending-ai" },
  },
  {
    term: "Guardrail",
    plain:
      "A control that constrains what a model can output or receive. The load-bearing two are output schema validation and PII redaction before inference.",
    why: "Deterministic guardrails (schema, substring, row counts) are trustworthy; using a second model to check the first mostly moves the problem, because it shares the failure mode.",
    module: { n: 7, slug: "build-your-own" },
  },
  {
    term: "Fine-tuning",
    plain:
      "Further training a model on your own examples so it adjusts its weights. Distinct from RAG, which changes the prompt, not the model.",
    why: "Rarely the right first move for a SOC — RAG and prompting get you most of the way with none of the cost, data or maintenance a fine-tune demands.",
    module: { n: 2, slug: "llm-mechanics" },
  },
  {
    term: "Structured output",
    plain:
      "Forcing the model to return JSON matching a schema you defined, rather than prose — the difference between something you can validate and something you can only read.",
    why: "Free text is unusable downstream — you cannot count, route or validate it. Every verdict on this path is schema-constrained (project 01) so it can be checked programmatically.",
    module: { n: 4, slug: "prompt-engineering" },
  },
  {
    term: "Normalisation",
    plain:
      "Mapping heterogeneous logs to one schema — one field name per concept — before the model sees them. OCSF, ASIM and ECS are the common target schemas.",
    why: "Raw heterogeneous input is noise amplification; the model ends up doing field mapping by guesswork. Normalising first cuts tokens ~8x and stops the guessing.",
    module: { n: 8, slug: "normalization" },
  },
  {
    term: "Backtest",
    plain:
      "Running a new detection rule over historical data and counting what it would have fired on, before enabling it.",
    why: "A model-drafted rule is a hypothesis until backtested. A rule firing 400 times a day is not deployable however elegant — and you learn that for free rather than by paging someone.",
    module: { n: 10, slug: "nl-to-detection" },
  },
  {
    term: "Precision / recall",
    plain:
      "Precision: of what you flagged, how much was real. Recall: of what was real, how much you caught. F1 combines them.",
    why: "A 1% false-positive rate is catastrophic at 100k events/day — 1,000 false alerts. The confusion matrix is a cost model, not a scorecard (module 03).",
    module: { n: 3, slug: "classical-ml" },
  },
  {
    term: "Golden dataset",
    plain:
      "A set of examples with trusted, human-assigned correct answers, used to measure a system. The labels are the reference truth.",
    why: "It is what turns opinions about an assistant into measurements — precision, recall and hallucination rate. Building it carefully is the whole foundation of the capstone (project 10).",
    module: { n: 3, slug: "classical-ml" },
  },
];

function TermCard({ t }: { t: Term }) {
  return (
    <li id={t.term.toLowerCase().replace(/[^a-z]+/g, "-")} className="scroll-mt-24 rounded-lg border-[1.5px] border-hairline bg-surface px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-[18px] font-bold tracking-[-0.02em]">
          {t.term}
        </h2>
        {t.module && (
          <Link
            href={`/ai-soc-prep/module/${t.module.slug}`}
            className="mono-label text-faint transition-colors hover:text-accent-strong"
          >
            MODULE {String(t.module.n).padStart(2, "0")} →
          </Link>
        )}
      </div>
      <p className="soc-prose mt-2 max-w-(--soc-measure)">{t.plain}</p>
      <div className="mt-2.5 max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-3.5 py-2">
        <span className="mono-label mb-1 block text-accent-strong">
          Why a SOC analyst cares
        </span>
        <p className="text-[13.5px] leading-relaxed text-muted-2">{t.why}</p>
      </div>
    </li>
  );
}

export default function GlossaryPage() {
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
          <span className="mono-label text-accent-strong">{TERMS.length} TERMS</span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Glossary
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            The path is jargon-dense for SOC people. Every term here is defined in
            plain English, with one line on why it matters in{" "}
            <b className="font-medium text-ink">this</b> context — a bare
            dictionary would be worth less.
          </p>
        </header>

        <ol className="mt-10 space-y-3">
          {TERMS.map((t) => (
            <TermCard key={t.term} t={t} />
          ))}
        </ol>
      </div>
    </div>
  );
}
