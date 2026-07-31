import Link from "next/link";
import type { Metadata } from "next";

const title = "When NOT to use AI in a SOC";
const description =
  "Six places an AI assistant has no business being — legal hold, active containment, unverifiable claims, insider investigations, HR-adjacent cases, and regulated determinations. One screen, opinionated.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/when-not-to-use-ai" },
  openGraph: { title, description, type: "article" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Moved forward from milestone 10 to milestone 1 deliberately.
 *
 * It is one screen and it costs an hour, but it is the strongest maturity
 * signal on the site — anyone can list AI capabilities, far fewer can name the
 * boundaries. Shipped last, it would probably never have shipped at all.
 */

interface Rule {
  n: number;
  title: string;
  why: string;
  instead: string;
  /** The line that makes it concrete. */
  example: string;
}

const RULES: Rule[] = [
  {
    n: 1,
    title: "Anything under legal hold",
    why: "Once a matter is under legal hold, the evidence chain has to survive a lawyer picking it apart. A model that paraphrases a log line has altered evidence — and a summary is a paraphrase.",
    instead:
      "Work from the raw artefacts. Preserve originals with hashes. If AI touched anything in the chain, disclose it before someone else finds it.",
    example:
      "Summarising a custodian's mailbox to save reading time is exactly the shortcut that ends up in a deposition.",
  },
  {
    n: 2,
    title: "Active containment decisions",
    why: "Isolating a host, disabling an account or blocking a range has an immediate business cost and, if wrong, causes the outage you were trying to prevent. A model has no view of what that host does at 09:00 on a Monday.",
    instead:
      "Let AI assemble the evidence and draft the recommendation. A named human presses the button and owns the consequence.",
    example:
      "\"Isolate the endpoint\" is a sentence a model produces cheaply and a business pays for expensively.",
  },
  {
    n: 3,
    title: "Any claim you cannot verify from the raw evidence",
    why: "This is the general form of every other rule. If there is no way to trace a statement back to a log line, a hash or a packet, then it is not a finding — it is a plausible sentence.",
    instead:
      "Require a citation for every claim, and check a sample of them. If the model cannot cite, it should return insufficient_evidence rather than prose.",
    example:
      "\"The attacker moved laterally via SMB\" with no event ID behind it is a hypothesis wearing a finding's clothes.",
  },
  {
    n: 4,
    title: "Insider investigations",
    why: "A named person's career is the subject. The output is read by HR, legal and possibly a tribunal, and confidently-wrong reasoning about a colleague is a harm you cannot take back. The data is also the most sensitive you hold.",
    instead:
      "Human-led throughout. If a model helps at all, restrict it to mechanical extraction — timestamps, file names, counts — never characterisation or intent.",
    example:
      "\"This access pattern suggests exfiltration intent\" is a model inferring motive. It cannot.",
  },
  {
    n: 5,
    title: "HR-adjacent and disciplinary cases",
    why: "Same reasoning as insider work, plus a legal requirement in several jurisdictions to explain how a decision about a person was reached. \"The model said so\" is not an explanation, and in some regimes an automated determination about an individual needs a documented human review.",
    instead:
      "Keep the reasoning human and written down. Use AI for formatting and structure if you like, never for the judgement.",
    example:
      "The question is not whether the output is right. It is whether you can explain the reasoning under challenge.",
  },
  {
    n: 6,
    title: "Regulated determinations and anything a regulator will read",
    why: "Breach notification thresholds, materiality calls, compliance attestations. These have statutory deadlines and legal consequence, and they get audited by someone whose job is to find the gap.",
    instead:
      "Human determination, documented reasoning, dated. If AI assisted, log the prompt, the model, its version and the reviewer alongside the decision.",
    example:
      "\"Is this reportable under GDPR Article 33?\" is a legal question with a 72-hour clock, not a classification task.",
  },
];

function Rule({ rule: r }: { rule: Rule }) {
  return (
    <li className="rounded-lg border-[1.5px] border-hairline bg-surface px-5 py-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-pill border-[1.5px] border-(--ai-unverified) font-mono text-[11px] font-bold text-(--ai-unverified)"
        >
          {String(r.n).padStart(2, "0")}
        </span>
        <h2 className="flex-1 font-display text-[19px] font-bold leading-tight tracking-[-0.02em] sm:text-[21px]">
          {r.title}
        </h2>
      </div>

      <div className="mt-3 space-y-3 sm:pl-10">
        <p className="soc-prose max-w-(--soc-measure)">{r.why}</p>

        <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-(--ai-verified) bg-surface-alt px-4 py-3">
          <span className="mono-label mb-1.5 block text-(--ai-verified)">
            Do this instead
          </span>
          <p className="soc-prose">{r.instead}</p>
        </div>

        <p className="max-w-(--soc-measure) border-l-2 border-hairline pl-3 text-[13.5px] italic leading-[1.65] text-muted-2">
          {r.example}
        </p>
      </div>
    </li>
  );
}

export default function WhenNotToUseAiPage() {
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
          <span className="mono-label text-(--ai-unverified)">
            THE BOUNDARIES
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            When <span className="text-(--ai-unverified)">not</span> to use AI
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[17px] leading-[1.65] text-muted">
            Everything else on this path is about what AI can do for a SOC. This
            page is the other half, and it is the half that makes you employable
            rather than a liability.
          </p>
          <p className="mt-3 max-w-(--soc-measure) font-mono text-[12.5px] leading-[1.7] text-muted-2">
            {
              "// A hiring manager has met plenty of candidates who can list capabilities. Far fewer can name the boundaries and say why."
            }
          </p>
        </header>

        <ol className="mt-10 space-y-4">
          {RULES.map((r) => (
            <Rule key={r.n} rule={r} />
          ))}
        </ol>

        {/* The single sentence that generalises all six. */}
        <section className="mt-12">
          <div className="max-w-(--soc-measure) rounded-lg border-[1.5px] border-ink bg-surface px-5 py-5">
            <span className="mono-label mb-2 block text-accent-strong">
              The test that covers all six
            </span>
            <p className="text-[17px] font-medium leading-[1.6] text-ink">
              If the answer to &ldquo;who is accountable if this is wrong?&rdquo;
              is anything other than a named human who has seen the raw evidence,
              the model should not be in that step.
            </p>
            <p className="mt-3 font-mono text-[11.5px] leading-relaxed text-muted-2">
              {
                "// Note what this does not say. It does not say don't use AI — it says don't move the accountability. AI can do the reading, the assembling and the drafting in every case above. It cannot do the signing."
              }
            </p>
          </div>
        </section>

        <div className="soc-noprint mt-12 border-t border-hairline pt-6">
          <Link
            href="/ai-soc-prep"
            className="mono-label inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
          >
            ← BACK TO AI SOC ANALYST
          </Link>
        </div>
      </div>
    </div>
  );
}
