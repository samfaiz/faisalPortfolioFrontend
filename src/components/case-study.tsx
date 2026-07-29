import Link from "next/link";
import type { CaseStudy, CaseStudyStep } from "@/lib/types";
import type { GuideLink } from "@/lib/guide-link";

/**
 * Walkthrough view for projects with nothing to render live.
 *
 * Deliberately a server component: it is all static content, so there is no
 * reason to ship the interactivity the LiveViewer needs. Screenshots use a
 * plain <img> rather than next/image because their host is the API's public
 * disk, which is not in the images remotePatterns allowlist — and adding it
 * would let any URL the CMS emits through the optimiser.
 */

function EvidenceBlock({ evidence }: { evidence: NonNullable<CaseStudyStep["evidence"]> }) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-hairline bg-surface-alt">
      {evidence.lang && (
        <div className="border-b border-hairline px-3 py-1.5">
          <span className="mono-label text-accent-strong">{evidence.lang}</span>
        </div>
      )}
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-[1.7] text-ink">
        {evidence.code}
      </pre>
    </div>
  );
}

function Step({ step, n }: { step: CaseStudyStep; n: number }) {
  return (
    <li className="scroll-mt-24 rounded-lg border-[1.5px] border-hairline bg-surface px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-pill border-[1.5px] border-hairline font-mono text-[11px] font-bold text-muted-2"
        >
          {String(n).padStart(2, "0")}
        </span>
        <h3 className="flex-1 font-display text-[18px] font-bold leading-tight tracking-[-0.02em] sm:text-[20px]">
          {step.title}
        </h3>
      </div>

      <div className="mt-3 sm:pl-10">
        {step.body && (
          <div
            className="soc-prose max-w-(--soc-measure)"
            dangerouslySetInnerHTML={{ __html: step.body }}
          />
        )}

        {step.image && (
          <figure className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.image}
              alt={step.caption ?? step.title}
              loading="lazy"
              className="w-full rounded-md border border-hairline bg-surface-alt"
            />
            {step.caption && (
              <figcaption className="mt-2 font-mono text-[11.5px] leading-relaxed text-muted-2">
                {step.caption}
              </figcaption>
            )}
          </figure>
        )}

        {step.evidence && <EvidenceBlock evidence={step.evidence} />}
      </div>
    </li>
  );
}

export function CaseStudyView({
  caseStudy: cs,
  guide,
}: {
  caseStudy: CaseStudy;
  guide?: GuideLink | null;
}) {
  return (
    <div className="space-y-8">
      {(cs.objective || cs.stack.length > 0) && (
        <div className="rounded-lg border-[1.5px] border-ink bg-surface px-5 py-5">
          {cs.objective && (
            <>
              <span className="mono-label mb-2 block text-accent-strong">
                Objective
              </span>
              <p className="max-w-(--soc-measure) text-[17px] font-medium leading-[1.6] text-ink">
                {cs.objective}
              </p>
            </>
          )}

          {cs.stack.length > 0 && (
            <div className="mt-4">
              <span className="mono-label mb-2 block text-accent-strong">
                Stack
              </span>
              <ul className="flex flex-wrap gap-1.5">
                {cs.stack.map((t) => (
                  <li
                    key={t}
                    className="rounded-sm border border-hairline px-2 py-0.5 font-mono text-[11px] text-muted-2"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {cs.steps.length > 0 && (
        <div>
          <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-2 border-b-2 border-ink pb-3">
            <h2 className="font-display text-[clamp(1.3rem,3.5vw,1.8rem)] font-bold uppercase leading-none tracking-[-0.03em]">
              What I did
            </h2>
            <span className="mono-label ml-auto text-faint">
              {cs.steps.length} {cs.steps.length === 1 ? "step" : "steps"}
            </span>
          </div>

          <ol className="space-y-4">
            {cs.steps.map((s, i) => (
              <Step key={i} step={s} n={i + 1} />
            ))}
          </ol>
        </div>
      )}

      {cs.outcome && (
        <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-4">
          <span className="mono-label mb-2 block text-accent-strong">
            Outcome
          </span>
          <p className="soc-prose">{cs.outcome}</p>
        </div>
      )}

      {/* The differentiator: built it AND documented it reproducibly. */}
      {guide && (
        <Link
          href={guide.href}
          className="flex items-center justify-between gap-3 rounded-lg border-[1.5px] border-accent bg-accent/5 px-5 py-4 transition-colors hover:bg-accent/10"
        >
          <span>
            <span className="mono-label block text-accent-strong">
              I WROTE THE FULL GUIDE FOR THIS · {guide.kitLabel}
            </span>
            <span className="mt-1 block text-[14px] text-muted-2">
              {guide.steps} steps, every command, what you should see at each
              one, and what to do when it breaks.
            </span>
          </span>
          <span aria-hidden className="font-mono text-[18px] text-accent-strong">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
