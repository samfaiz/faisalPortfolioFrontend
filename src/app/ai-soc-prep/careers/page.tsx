import Link from "next/link";
import type { Metadata } from "next";

const title = "Careers & interview prep — AI SOC Analyst";
const description =
  "Twenty-five likely interview questions with how to answer them, how to describe AI-assisted work without sounding like you outsource judgment, and the one measured sentence that ends an interview in your favour.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/careers" },
  openGraph: { title, description, type: "article" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Ties the path to an outcome. Each question pairs a likely interview prompt
 * with the shape of a strong answer — grounded in what the path actually built,
 * so the answers are demonstrable rather than rehearsed.
 */
interface QA {
  q: string;
  a: string;
}

const QUESTIONS: QA[] = [
  {
    q: "How do you use AI in triage without letting it make decisions?",
    a: "AI does the reading, assembling and drafting; a named human owns the verdict. It summarises, enriches, correlates and drafts — it never closes an alert, escalates, contains, or touches legal hold. The analyst signs the ticket, not the model.",
  },
  {
    q: "How do you know the model didn't just make something up?",
    a: "Grounding plus a validator. Every claim must cite a raw log line, and a check confirms the citation is a literal substring of the input — not a paraphrase. A citation the model invented is rejected, not shown with a caveat. That's the base habit of everything I build.",
  },
  {
    q: "What's the difference between a good AI-for-SOC candidate and a liability?",
    a: "Data handling. Knowing what may and may not be sent to a model — the local / redact / never-send tree — and keeping an audit trail of prompt, model, version, reviewer and timestamp. It's the module everyone skips and the one that makes you employable rather than a risk.",
  },
  {
    q: "Walk me through triaging an alert with your assistant.",
    a: "Normalise the events, dedup and cluster in code, retrieve the relevant runbook, one model call for a grounded verdict, validate the citations, then a human gate. Six steps, only one is the model — and I can tell you why that ratio is right.",
  },
  {
    q: "What does the anomaly score in our SIEM actually mean?",
    a: "It's a statistical measure of how far a value sits from a baseline — an isolation forest or a z-score, not generative AI. Unusual isn't malicious; a late-night login is anomalous and often benign. I'd want to know what it computes and how it behaves on known-benign spikes before trusting it.",
  },
  {
    q: "Why is a 1% false-positive rate a problem?",
    a: "At 100,000 events a day it's 1,000 false alerts — more than any team can triage. The confusion matrix is a cost model: a false positive is wasted analyst time, a false negative is a missed incident, and base rate decides whether a given error rate is survivable.",
  },
  {
    q: "How do you generate detection queries with AI safely?",
    a: "Ground the model in the real schema, then validate before running: a static field check, a parse, a bounded dry run over 15 minutes, and a row-count sanity check. An invented column returns zero rows in Sentinel and reads as 'nothing found', so I never blind-execute generated queries.",
  },
  {
    q: "How would you detect prompt injection against one of our LLM apps?",
    a: "First, get it logging the semantic events — the full prompt with retrieved context, every tool call with arguments, the raw output. Then the detections follow: an out-of-scope retrieval, a tool call a role shouldn't trigger, output quoting the system prompt. You can't detect what you don't log.",
  },
  {
    q: "Direct or indirect prompt injection — which worries you more?",
    a: "Indirect, by far. The attacker plants instructions in data the model reads — a ticket, a web page, an email — and never touches our system directly. The payload rides in with legitimate data, and the model can't tell content from commands.",
  },
  {
    q: "How do you detect AI-generated phishing when it reads perfectly?",
    a: "I stop detecting the writing and detect the infrastructure and behaviour — sender domain age, DMARC alignment, the mail path, and what the endpoint did after the click. Those are what the attacker still can't fake with a better prompt. Content was never the strongest signal, just the easiest.",
  },
  {
    q: "What's your take on deepfake CFO-fraud calls?",
    a: "You probably can't detect the fake in real time, so the control is procedural — out-of-band callback, a second approver, a cooling-off on urgent-and-confidential requests. The countermeasure is a phone call, not a classifier. My SOC role is to advocate for it and alert when it's bypassed.",
  },
  {
    q: "How do you use AI in malware analysis without trusting it?",
    a: "The model summarises what a deterministic tool proved — CAPA finds a capability and cites the address, the model explains it, and a validator rejects any capability CAPA didn't report. On deobfuscation it's genuinely good, but I verify every extracted IOC against the raw bytes.",
  },
  {
    q: "Where does AI fail hardest in reverse engineering?",
    a: "Decompiler output. It'll describe a function fluently and confidently and be wrong — 'this decrypts config with RC4' when it doesn't. The tell is specificity; I confirm any claim against a second independent source, like imports and strings, before believing it.",
  },
  {
    q: "How far does AI actually take malware triage?",
    a: "The first 70% — identification, deobfuscation, IOC extraction, first-draft detections. It doesn't replace the reverse engineer for the last 30%, and knowing that ceiling is the point. I escalate a person, not a bigger model, for custom or high-consequence samples.",
  },
  {
    q: "Tell me about a control you built into an AI system.",
    a: "An approval gate on an MCP agent. Every tool is read-only unless there's a reason otherwise, and anything with a side effect stops for human approval. I plant an injection in an enrichment result to show the agent trying to act on it and the gate holding. A demonstrated control beats a described one.",
  },
  {
    q: "How do you measure whether your assistant is any good?",
    a: "A labelled golden dataset and an eval harness — precision, recall, and the hallucination rate, which is how often it cites evidence not in the input. I run a prompt A/B on the same set so I can prove a change helped, and I write up where it fails.",
  },
  {
    q: "What's the most important metric for a triage assistant?",
    a: "The hallucination rate. Verdict accuracy is table stakes; whether it invents the supporting evidence is the failure that matters, because a right verdict reached through fabricated evidence is still a hallucination and still not trustworthy.",
  },
  {
    q: "When would you NOT use AI?",
    a: "Legal hold, active containment, insider and HR cases, regulated determinations, and anything I can't verify from raw evidence. The test that covers them: if accountability doesn't rest on a named human who saw the evidence, the model shouldn't be in that step.",
  },
  {
    q: "Local model or a hosted API — how do you decide?",
    a: "Data handling decides what may leave, and the harness decides whether the local model is close enough. I keep sensitive triage local, use hosted models on public or redacted data where the quality pays, and I can prove the local model's accuracy rather than assume it.",
  },
  {
    q: "How do you treat a model's confidence score?",
    a: "As an ordering hint, not a probability, until I've measured calibration on a golden set. Models are overconfident by default, so auto-routing on an unmeasured threshold can close real incidents. I measure first, then decide if I can route on it.",
  },
  {
    q: "Why do you version your prompts?",
    a: "Because a prompt determines behaviour like a detection rule — it needs versioning, a test set, review and rollback. When the output changes after a model update, the versioned prompt and the model tag are how I find out what changed.",
  },
  {
    q: "What's wrong with using a second LLM to check the first?",
    a: "The checker shares the first model's failure mode, so now I have two unverified components. The trustworthy guardrails are deterministic — schema validation, a substring check, a row count. A model checking a model mostly moves the problem.",
  },
  {
    q: "How do you tell a genuine vendor AI feature from a wrapper?",
    a: "Three questions: what's it grounded in, can I inspect and version the prompt, and what does it cost per invocation. The test is 'what does it know that a general model doesn't?' If the answer is nothing, it's a wrapper — often priced like a feature.",
  },
  {
    q: "Why does normalisation matter before AI?",
    a: "Cost, attention and correlation. A raw event is ~480 tokens and 80% boilerplate; normalised it's ~60, so eight times more context fits and the model isn't doing field-mapping by guesswork. Raw heterogeneous input is noise amplification.",
  },
  {
    q: "Sell me on why you're ready for an AI-augmented SOC role.",
    a: "I measured my triage assistant at 82% precision with a 6% hallucination rate on a 50-alert labelled set, the grounded prompt beat the naive one by nine points, and I can tell you exactly where it still fails. Anyone can say they use AI for triage — I engineered and measured a system.",
  },
];

export default function CareersPage() {
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
            {QUESTIONS.length} QUESTIONS · TIED TO WHAT YOU BUILT
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Careers &amp; interview prep
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted">
            The difference between a candidate who <i>says</i> they use AI and one
            who can <b className="font-medium text-ink">demonstrate</b> it is the
            whole point of this path. Every answer below maps to something you
            actually built and measured — so it&rsquo;s a demonstration, not a
            rehearsal.
          </p>
        </header>

        {/* The one sentence. */}
        <section className="mt-10">
          <div className="max-w-(--soc-measure) rounded-lg border-[1.5px] border-(--ai-verified) bg-(--ai-verified)/5 px-5 py-5">
            <span className="mono-label mb-2 block text-(--ai-verified)">
              THE SENTENCE THAT GETS THE JOB
            </span>
            <p className="text-[17px] font-medium leading-[1.6] text-ink">
              &ldquo;I measured my triage assistant at 82% precision with a 6%
              hallucination rate on a 50-alert labelled set, the grounded prompt
              beat the naive one by nine points, and here is exactly where it
              still fails.&rdquo;
            </p>
            <p className="mt-3 font-mono text-[11.5px] leading-relaxed text-muted-2">
              {
                "// Anyone can claim they use AI for triage. This is engineering, and it comes from project 10 — the capstone."
              }
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mono-label mb-4 flex items-center gap-3 text-accent-strong">
            LIKELY QUESTIONS
            <span aria-hidden className="h-px flex-1 bg-hairline" />
          </h2>
          <ol className="space-y-3">
            {QUESTIONS.map((qa, i) => (
              <li
                key={i}
                className="rounded-lg border-[1.5px] border-hairline bg-surface px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 font-mono text-[11px] font-bold text-faint"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-[16px] font-bold leading-snug tracking-[-0.01em]">
                    {qa.q}
                  </h3>
                </div>
                <div className="mt-2.5 sm:pl-8">
                  <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3">
                    <span className="mono-label mb-1.5 block text-accent-strong">
                      Shape of a strong answer
                    </span>
                    <p className="soc-prose">{qa.a}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Portfolio framing. */}
        <section className="mt-12">
          <h2 className="mono-label mb-4 flex items-center gap-3 text-accent-strong">
            HOW TO FRAME THE PORTFOLIO
            <span aria-hidden className="h-px flex-1 bg-hairline" />
          </h2>
          <ul className="space-y-2">
            {[
              "Lead with the eval harness (project 10). The metrics and the failure analysis are what separate you — put them first, not the chatbot.",
              "Show one grounded tool with its validator visible, so a reader sees you check the model rather than just call it.",
              "Show the MCP agent with the injection test and the gate holding — a demonstrated control is worth more than a described one.",
              "Publish a rendered incident report with the citations and the gaps section visible; the honesty is the signal.",
              "For every artefact, publish the limits alongside it. Naming where your system fails is what proves you understand it.",
            ].map((t, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-md border border-hairline bg-surface px-4 py-3 text-[14px] leading-relaxed text-muted-2"
              >
                <span aria-hidden className="text-accent-strong">
                  →
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="soc-noprint mt-12 border-t border-hairline pt-6">
          <Link
            href="/ai-soc-prep/module/readiness"
            className="mono-label inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
          >
            ← MODULE 15 · READINESS CHECKPOINT
          </Link>
        </div>
      </div>
    </div>
  );
}
