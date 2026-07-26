"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { GuideCommand, GuideStep, ProjectGuide } from "@/lib/guides/types";

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                 */
/* -------------------------------------------------------------------------- */

function Html({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function BlockHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mono-label flex items-center gap-3 text-accent-strong">
      {children}
      <span aria-hidden className="h-px flex-1 bg-hairline" />
    </h3>
  );
}

/** Copy-to-clipboard block. The whole point of these guides is pasting, so the
 *  button is part of the block rather than a hover affordance. */
function CommandBlock({ cmd }: { cmd: GuideCommand }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard is blocked on insecure origins and in some browsers; the
      // code is selectable either way, so fail quietly rather than alarm.
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-md border border-hairline bg-surface-alt">
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-1.5">
        {cmd.lang && (
          <span className="mono-label text-accent-strong">{cmd.lang}</span>
        )}
        {cmd.label && (
          <span className="font-mono text-[10.5px] text-muted-2">{cmd.label}</span>
        )}
        {cmd.where && (
          <span className="mono-label ml-auto hidden text-faint sm:inline">
            {cmd.where}
          </span>
        )}
        <button
          type="button"
          onClick={copy}
          className={cn(
            "soc-noprint rounded-pill border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.08em] transition-colors",
            cmd.where ? "" : "ml-auto",
            copied
              ? "border-accent bg-accent text-paper"
              : "border-hairline text-muted-2 hover:border-ink hover:text-ink"
          )}
        >
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-[1.7] text-ink">
        {cmd.code}
      </pre>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* One step                                                                    */
/* -------------------------------------------------------------------------- */

function StepCard({
  step,
  n,
  done,
  onToggle,
}: {
  step: GuideStep;
  n: number;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      id={`step-${n}`}
      className={cn(
        "scroll-mt-24 rounded-lg border-[1.5px] px-4 py-4 transition-colors sm:px-6 sm:py-5",
        done ? "border-hairline bg-surface-alt/40" : "border-hairline bg-surface"
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={done ? `Mark step ${n} not done` : `Mark step ${n} done`}
          className={cn(
            "soc-noprint mt-0.5 grid size-7 shrink-0 place-items-center rounded-pill border-[1.5px] font-mono text-[11px] font-bold transition-colors",
            done
              ? "border-accent bg-accent text-paper"
              : "border-hairline text-muted-2 hover:border-ink hover:text-ink"
          )}
        >
          {done ? "✓" : String(n).padStart(2, "0")}
        </button>
        {/* The time chip is long enough ("45 min (mostly waiting)") to squeeze
            the title into three lines at 390px, so below sm it drops onto its
            own row instead of competing for width. */}
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              "font-display text-[19px] font-bold leading-tight tracking-[-0.02em] sm:text-[21px]",
              done && "text-muted-2"
            )}
          >
            {step.title}
          </h2>
          {step.time && (
            <span className="mono-label mt-1.5 block text-faint sm:hidden">
              {step.time}
            </span>
          )}
        </div>
        {step.time && (
          <span className="mono-label mt-1.5 hidden shrink-0 text-faint sm:inline">
            {step.time}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-1 pl-0 sm:pl-10">
        {step.warn && (
          <p className="mono-label mb-3 rounded-md border border-(--soc-l1) bg-(--soc-l1)/10 px-3 py-2 text-(--soc-l1)">
            ⚠ {step.warn}
          </p>
        )}

        {step.why && (
          <p className="mb-3 max-w-(--soc-measure) border-l-2 border-accent pl-3 text-[13.5px] italic leading-[1.65] text-muted-2">
            {step.why}
          </p>
        )}

        <Html className="soc-prose max-w-(--soc-measure)" html={step.body} />

        {step.commands?.map((c, i) => <CommandBlock key={i} cmd={c} />)}

        {(step.expect || step.expectCode) && (
          <div className="my-3 max-w-(--soc-measure) rounded-md border border-accent/40 bg-accent/5 px-3.5 py-3">
            <span className="mono-label mb-1.5 block text-accent-strong">
              ✓ Checkpoint — you should see
            </span>
            {step.expect && <Html className="soc-prose" html={step.expect} />}
            {step.expectCode && (
              <pre className="mt-2 overflow-x-auto rounded-sm bg-surface-alt px-3 py-2.5 font-mono text-[12px] leading-[1.65] text-muted-2">
                {step.expectCode}
              </pre>
            )}
          </div>
        )}

        {step.fixes && step.fixes.length > 0 && (
          <details className="soc-noprint group mt-3 max-w-(--soc-measure) rounded-md border border-hairline bg-surface-alt">
            <summary className="mono-label cursor-pointer list-none px-3.5 py-2.5 text-muted-2 hover:text-ink">
              <span className="inline-block transition-transform group-open:rotate-90">
                ▸
              </span>{" "}
              If it didn&rsquo;t work — {step.fixes.length}{" "}
              {step.fixes.length === 1 ? "fix" : "fixes"}
            </summary>
            <ul className="space-y-3 border-t border-hairline px-3.5 py-3">
              {step.fixes.map((f, i) => (
                <li key={i} className="space-y-1">
                  <p className="font-mono text-[12px] font-bold text-ink">
                    {f.problem}
                  </p>
                  <p className="soc-prose text-[13px] text-muted-2">
                    <b className="font-medium text-ink">Why:</b> {f.cause}
                  </p>
                  <Html
                    className="soc-prose text-[13px]"
                    html={`<b class="font-medium text-ink">Fix:</b> ${f.fix}`}
                  />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export interface GuideChrome {
  /** "SOC PREP" / "CLOUD SEC." — matches the kit's wordmark. */
  kitLabel: string;
  /** Back link to the kit's projects section. */
  backHref: string;
  /** Project metadata rendered in the header. */
  projectNumber: number;
  title: string;
  tagline: string;
  tierLabel: string;
  hours: string;
  cost: string;
  stack: string[];
  prerequisites: string[];
  validation: string[];
  pitch: string;
  stretch: string[];
  /** localStorage namespace so SOC and Cloud progress don't collide. */
  storageKey: string;
}

export function GuidePage({
  guide,
  chrome,
}: {
  guide: ProjectGuide;
  chrome: GuideChrome;
}) {
  const key = `${chrome.storageKey}:${guide.slug}`;
  const [done, setDone] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (Array.isArray(raw)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDone(new Set(raw.filter((n) => typeof n === "number")));
      }
    } catch {}
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify([...done]));
    } catch {}
  }, [done, hydrated, key]);

  const toggle = (n: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const pct = Math.round((done.size / guide.steps.length) * 100);

  return (
    <div className="soc-page min-h-screen bg-paper text-ink">
      {/* Progress rail */}
      <div
        className="soc-noprint fixed inset-x-0 top-0 z-50 h-1 bg-hairline"
        aria-hidden
      >
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mx-auto max-w-225 px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        <Link
          href={chrome.backHref}
          className="mono-label soc-noprint inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
        >
          ← BACK TO {chrome.kitLabel}
        </Link>

        {/* ---- Header ---- */}
        <header className="mt-6 border-b-2 border-ink pb-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label text-accent-strong">
              PROJECT {String(chrome.projectNumber).padStart(2, "0")}
            </span>
            <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
              {chrome.tierLabel}
            </span>
            <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
              {chrome.hours}
            </span>
          </div>

          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            {chrome.title}
          </h1>
          <p className="mt-3 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            {chrome.tagline}
          </p>

          <p className="mono-label mt-4 inline-block rounded-md border border-(--soc-l1) bg-(--soc-l1)/10 px-3 py-2 text-(--soc-l1)">
            COST — {chrome.cost.replace(/<\/?b>/g, "")}
          </p>
        </header>

        {/* ---- Orientation ---- */}
        <section className="mt-8 space-y-6">
          <div className="space-y-2">
            <BlockHeading>What you&rsquo;re building</BlockHeading>
            <Html className="soc-prose max-w-(--soc-measure)" html={guide.intro} />
          </div>

          {guide.before && guide.before.length > 0 && (
            <div className="space-y-2">
              <BlockHeading>Before you start, you need</BlockHeading>
              <ul className="soc-prose max-w-(--soc-measure) space-y-1.5">
                {guide.before.map((b, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span aria-hidden className="text-accent-strong">
                      □
                    </span>
                    <Html html={b} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {guide.glossary && guide.glossary.length > 0 && (
            <details className="group rounded-lg border border-hairline bg-surface-alt">
              <summary className="mono-label cursor-pointer list-none px-4 py-3 text-accent-strong">
                <span className="inline-block transition-transform group-open:rotate-90">
                  ▸
                </span>{" "}
                WORDS USED IN THIS GUIDE ({guide.glossary.length})
              </summary>
              <dl className="space-y-3 border-t border-hairline px-4 py-4">
                {guide.glossary.map((g) => (
                  <div key={g.term}>
                    <dt className="font-mono text-[12px] font-bold text-ink">
                      {g.term}
                    </dt>
                    <dd className="soc-prose text-[13.5px] text-muted-2">
                      <Html html={g.plain} />
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          )}

          <div className="space-y-2">
            <BlockHeading>Tools you&rsquo;ll use</BlockHeading>
            <ul className="flex flex-wrap gap-1.5">
              {chrome.stack.map((t) => (
                <li
                  key={t}
                  className="rounded-sm border border-hairline px-2 py-0.5 font-mono text-[11px] text-muted-2"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---- Steps ---- */}
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-2 border-b-2 border-ink pb-3">
            <h2 className="font-display text-[clamp(1.35rem,3.5vw,1.9rem)] font-bold uppercase leading-none tracking-[-0.03em]">
              Step by step
            </h2>
            <span className="mono-label ml-auto text-faint">
              {hydrated ? `${done.size} / ${guide.steps.length} done` : `${guide.steps.length} steps`}
            </span>
          </div>

          <ol className="space-y-4">
            {guide.steps.map((s, i) => (
              <StepCard
                key={i}
                step={s}
                n={i + 1}
                done={done.has(i + 1)}
                onToggle={() => toggle(i + 1)}
              />
            ))}
          </ol>
        </section>

        {/* ---- Wrap-up ---- */}
        <section className="mt-12 space-y-6">
          <div className="space-y-2">
            <BlockHeading>How you know it actually worked</BlockHeading>
            <ul className="soc-prose max-w-(--soc-measure) space-y-1.5">
              {chrome.validation.map((v, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden className="text-accent-strong">
                    ✓
                  </span>
                  <Html html={v} />
                </li>
              ))}
            </ul>
          </div>

          {guide.after && guide.after.length > 0 && (
            <div className="space-y-2">
              <BlockHeading>When you&rsquo;re finished</BlockHeading>
              <ul className="soc-prose max-w-(--soc-measure) space-y-1.5">
                {guide.after.map((a, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span aria-hidden className="text-accent-strong">
                      →
                    </span>
                    <Html html={a} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-4">
            <span className="mono-label mb-2 block text-accent-strong">
              How to talk about it in an interview
            </span>
            <p className="soc-prose italic">{chrome.pitch}</p>
          </div>

          {chrome.stretch.length > 0 && (
            <div className="space-y-2">
              <BlockHeading>Take it further</BlockHeading>
              <ul className="soc-prose max-w-(--soc-measure) space-y-1.5">
                {chrome.stretch.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span aria-hidden className="text-faint">
                      +
                    </span>
                    <Html html={s} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="soc-noprint mt-14 border-t border-hairline pt-6">
          <Link
            href={chrome.backHref}
            className="mono-label inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
          >
            ← BACK TO {chrome.kitLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
