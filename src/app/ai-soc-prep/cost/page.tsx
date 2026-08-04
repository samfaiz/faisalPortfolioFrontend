import Link from "next/link";
import type { Metadata } from "next";

const title = "Cost & architecture — AI SOC Analyst";
const description =
  "The practical question every manager asks: token maths, local vs hosted-API cost, the latency budget for a triage loop, GPU sizing, and when a 7B model is genuinely enough.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/cost" },
  openGraph: { title, description, type: "article" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * The manager's page. Concrete numbers, stated as illustrative arithmetic
 * rather than invented benchmarks — the goal is to give a reader the shape of
 * the cost model so they can plug in their own figures.
 */

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-2 border-b-2 border-ink pb-3">
        <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-accent-strong">
          {n}
        </span>
        <h2 className="font-display text-[clamp(1.25rem,3.5vw,1.7rem)] font-bold uppercase leading-none tracking-[-0.03em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function CostPage() {
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
            THE MANAGER&rsquo;S QUESTION
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Cost &amp; architecture decisions
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            Every technical case for AI in a SOC meets the same question: what
            does it cost, and where does it run? The numbers below are{" "}
            <b className="font-medium text-ink">illustrative arithmetic</b>, not
            benchmarks — plug in your own token counts and prices, but the shape
            of the model is what matters.
          </p>
        </header>

        <Section n="/01" title="Token maths, the foundation">
          <p className="soc-prose max-w-(--soc-measure)">
            Everything a model costs — in money on a hosted API, in memory and
            time locally — is counted in tokens. So the first lever is not the
            model, it is <b>how many tokens you spend per decision</b>, and that
            is set by normalisation (module 08), not by the model choice.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-ink">
                  {["", "Raw", "Normalised", "Why it matters"].map((h) => (
                    <th key={h} className="mono-label px-3 py-2 text-accent-strong">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[13.5px]">
                {[
                  ["Tokens / event", "~480", "~60", "8x fewer to send and hold"],
                  ["Events per 8k window", "~16", "~130", "One moment vs the whole sequence"],
                  ["Cost per event (hosted)", "higher", "~1/8", "Directly proportional to tokens"],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-divider align-top">
                    {row.map((c, j) => (
                      <td
                        key={j}
                        className={`px-3 py-2.5 leading-relaxed ${
                          j === 0 ? "font-medium text-ink" : "text-muted-2"
                        }`}
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3">
            <span className="mono-label mb-1.5 block text-accent-strong">
              The lesson
            </span>
            <p className="soc-prose">
              Normalise before you optimise the model. An 8x token reduction is a
              far bigger cost lever than switching models, and it improves the
              answer at the same time — which is rare.
            </p>
          </div>
        </Section>

        <Section n="/02" title="Local vs hosted, the real cost model">
          <p className="soc-prose max-w-(--soc-measure)">
            The instinct is to compare per-token API price against a free local
            model and stop there. The honest comparison has more terms — and it
            usually favours local for high-volume triage on sensitive data.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-[1.5px] border-hairline bg-surface px-5 py-4">
              <span className="mono-label block text-accent-strong">
                LOCAL (OLLAMA)
              </span>
              <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-muted-2">
                <li>No per-query cost — hardware is a one-time spend</li>
                <li>Data never leaves the box (module 05 becomes easy)</li>
                <li>Slower per inference on CPU; fine for a triage loop</li>
                <li>You own the availability — no dependency to cut during an incident</li>
              </ul>
            </div>
            <div className="rounded-lg border-[1.5px] border-hairline bg-surface px-5 py-4">
              <span className="mono-label block text-accent-strong">
                HOSTED API
              </span>
              <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-muted-2">
                <li>Metered per token — scales linearly with alert volume</li>
                <li>Stronger structured output and refusal calibration</li>
                <li>Data leaves your network — module 05 applies before anything real</li>
                <li>A connectivity dependency you may deliberately cut mid-incident</li>
              </ul>
            </div>
          </div>
          <p className="soc-prose mt-4 max-w-(--soc-measure)">
            The decision is rarely all-or-nothing. The pattern that wins: do the
            deterministic work and the high-volume triage <b>locally</b>, and
            reach for a hosted model only where its quality clearly pays — on
            public or redacted data, for report prose, or as the eval-harness
            comparison. Project 03&rsquo;s cost note works the arithmetic: sending
            42,000 raw events to an API is tens of dollars and minutes of latency
            for a worse answer; sending 20 clusters is a fraction of a cent.
          </p>
        </Section>

        <Section n="/03" title="The latency budget for a triage loop">
          <p className="soc-prose max-w-(--soc-measure)">
            A triage assistant sits in a human&rsquo;s workflow, so latency is a
            product decision, not just a performance one. The budget is roughly
            &ldquo;how long will an analyst wait before the assistant is more
            friction than help?&rdquo; — usually a few seconds per verdict.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-ink">
                  {["Step", "Rough cost", "Note"].map((h) => (
                    <th key={h} className="mono-label px-3 py-2 text-accent-strong">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[13.5px]">
                {[
                  ["Normalise + retrieve", "milliseconds", "Code and a vector lookup — negligible"],
                  ["Embedding (dedup/RAG)", "tens of ms each", "Batch where you can"],
                  ["Model inference (8B, CPU)", "seconds", "The dominant term; GPU cuts it sharply"],
                  ["Validate + gate", "milliseconds", "Deterministic; free"],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-divider align-top">
                    {row.map((c, j) => (
                      <td
                        key={j}
                        className={`px-3 py-2.5 leading-relaxed ${
                          j === 0 ? "font-medium text-ink" : "text-muted-2"
                        }`}
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="soc-prose mt-4 max-w-(--soc-measure)">
            Inference dominates. If the loop is too slow, the levers in order are:
            fewer tokens (normalise harder), a smaller model where it still
            passes the structured-output test, or a GPU. Reaching for a bigger
            model to fix latency is backwards.
          </p>
        </Section>

        <Section n="/04" title="GPU sizing, and when 7B is enough">
          <p className="soc-prose max-w-(--soc-measure)">
            The honest answer most of the time: a 7–8B model on a 16 GB machine,
            no GPU required, is enough for the bulk of this path. Reach higher
            only when a measured need — not a benchmark — demands it.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-ink">
                  {["Size", "RAM", "Good for", "Reach for it when…"].map((h) => (
                    <th key={h} className="mono-label px-3 py-2 text-accent-strong">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[13.5px]">
                {[
                  ["3B", "~4 GB", "Extraction, classification", "Speed matters more than reasoning"],
                  ["7–8B", "~6–8 GB", "The sweet spot — most of this path", "Default; start here"],
                  ["14B", "~12 GB", "Better reasoning & refusal", "Measured need on your golden set"],
                  ["70B", "~40 GB+", "Strong, needs a GPU", "A specific task the smaller ones fail"],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-divider align-top">
                    {row.map((c, j) => (
                      <td
                        key={j}
                        className={`px-3 py-2.5 leading-relaxed ${
                          j === 0 ? "font-medium text-ink" : "text-muted-2"
                        }`}
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 max-w-(--soc-measure) rounded-r-md border-l-2 border-(--ai-verified) bg-surface-alt px-4 py-3">
            <span className="mono-label mb-1.5 block text-(--ai-verified)">
              Decide with the harness, not the leaderboard
            </span>
            <p className="soc-prose">
              Project 10 lets you answer &ldquo;is a bigger model worth it?&rdquo;
              with data: run the same golden set through a 7B and a 14B and
              compare precision, recall and hallucination. Often the 7B is close
              enough that the extra memory and latency are not justified — and now
              you can prove it rather than assert it.
            </p>
          </div>
        </Section>

        <div className="soc-noprint mt-14 border-t border-hairline pt-6">
          <Link
            href="/ai-soc-prep/module/build-your-own"
            className="mono-label inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
          >
            ← MODULE 07 · THE BUILD-YOUR-OWN LAYER
          </Link>
        </div>
      </div>
    </div>
  );
}
