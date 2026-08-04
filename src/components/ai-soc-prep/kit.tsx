"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  BLOCK_NAMES,
  MODULES,
  MODULES_BY_BLOCK,
  MODULE_COUNT,
  TOTAL_MINUTES,
  type Block,
  type Module,
} from "@/lib/ai-soc-prep/data";

const DONE_KEY = "ai-soc-prep:done";

/**
 * The path's visual grammar, stated once on the landing page and repeated on
 * every module and diagram: blue-dashed is what the model produced, green-solid
 * is what a human verified. It is the whole thesis in one legend.
 */
function VerificationLegend() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-md border-[1.5px] border-dashed border-(--ai-model) bg-(--ai-model)/5 px-4 py-3">
        <span className="mono-label block text-(--ai-model)">
          ▚ MODEL OUTPUT
        </span>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-2">
          Dashed and blue. Plausible, useful, unverified. Nothing here closes a
          ticket.
        </p>
      </div>
      <div className="rounded-md border-[1.5px] border-(--ai-verified) bg-(--ai-verified)/5 px-4 py-3">
        <span className="mono-label block text-(--ai-verified)">
          ✓ HUMAN VERIFIED
        </span>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-2">
          Solid and green. Checked against the raw evidence by the analyst who
          signs the ticket.
        </p>
      </div>
    </div>
  );
}

function ModuleCard({
  module: m,
  done,
  onToggle,
}: {
  module: Module;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="soc-card overflow-hidden rounded-md border-[1.5px] border-hairline bg-surface transition-colors hover:border-ink">
      <div className="flex items-start gap-3 p-4 sm:px-5">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={done ? `Mark module ${m.n} not done` : `Mark module ${m.n} done`}
          className={cn(
            "soc-noprint mt-0.5 grid size-7 shrink-0 place-items-center rounded-pill border-[1.5px] font-mono text-[11px] font-bold transition-colors",
            done
              ? "border-accent bg-accent text-paper"
              : "border-hairline text-muted-2 hover:border-ink hover:text-ink"
          )}
        >
          {done ? "✓" : String(m.n).padStart(2, "0")}
        </button>

        <div className="min-w-0 flex-1">
          <Link
            href={`/ai-soc-prep/module/${m.slug}`}
            className="group block"
          >
            <h3
              className={cn(
                "text-[15px] font-semibold tracking-[-0.01em] transition-colors group-hover:text-accent-strong",
                done ? "text-muted-2" : "text-ink"
              )}
            >
              {m.title}
            </h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted-2">
              {m.summary}
            </p>
          </Link>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="mono-label text-faint">{m.minutes} MIN</span>
            {m.projects.length > 0 && (
              <span className="mono-label text-faint">
                PROJECT {m.projects.map((p) => String(p).padStart(2, "0")).join(", ")}
              </span>
            )}
            <Link
              href={`/ai-soc-prep/module/${m.slug}`}
              className="mono-label ml-auto text-accent-strong hover:underline"
            >
              OPEN →
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

export function AiSocPrepKit() {
  const [done, setDone] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]");
      if (Array.isArray(raw)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDone(new Set(raw.filter((n) => typeof n === "number")));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify([...done]));
    } catch {}
  }, [done, hydrated]);

  const toggle = (n: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const pct = Math.round((done.size / MODULE_COUNT) * 100);
  const hours = useMemo(() => Math.round(TOTAL_MINUTES / 60), []);

  return (
    <div className="soc-page min-h-screen bg-paper text-ink">
      <div
        className="soc-noprint fixed inset-x-0 top-0 z-50 h-1 bg-hairline"
        aria-hidden
      >
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        {/* ---- Hero ---- */}
        <header>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/"
              className="mono-label soc-noprint text-muted-2 transition-colors hover:text-ink"
            >
              ← FAISALKHAN.CLOUD
            </Link>
            <span className="mono-label text-faint">AI SOC ANALYST PATH</span>
          </div>

          <h1 className="mt-5 font-display text-[clamp(2rem,6vw,3.4rem)] font-bold leading-[1] tracking-[-0.04em]">
            AI SOC ANALYST<span className="text-accent-strong">.</span>
          </h1>

          <p className="mt-5 max-w-(--soc-measure) text-[17px] leading-[1.65] text-muted">
            Most &ldquo;AI for SOC&rdquo; content is a tool tour that ages in six
            months. This path teaches AI as an{" "}
            <b className="font-medium text-ink">
              evidence-processing layer that a human stays accountable for
            </b>
            . Every module ends with the same question: how do you know the model
            didn&rsquo;t make this up?
          </p>

          <div className="mt-5 max-w-(--soc-measure) space-y-1 font-mono text-[12.5px] leading-[1.7] text-muted-2">
            <p>
              {"// "}Anyone can say &ldquo;I use AI for triage&rdquo;. Very few can
              say <b className="font-medium text-ink">
                &ldquo;I measured mine at 82% precision with a 6% hallucination
                rate, and here&rsquo;s the eval harness.&rdquo;
              </b>
            </p>
            <p>
              {"// "}Assumes L1 fundamentals — finish{" "}
              <Link href="/soc-prep" className="underline hover:text-ink">
                /soc-prep
              </Link>{" "}
              first if you need them.
            </p>
            <p>{"// Local models. Public datasets. Every project reproducible."}</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border-[1.5px] border-ink bg-hairline sm:grid-cols-4">
            {[
              { n: MODULE_COUNT, label: "Modules" },
              { n: 10, label: "Projects" },
              { n: `${hours}h`, label: "Reading time" },
              { n: "£0", label: "Tools needed" },
            ].map((m) => (
              <div key={m.label} className="bg-surface p-4">
                <span className="block font-display text-[26px] font-bold leading-none tracking-[-0.03em]">
                  {m.n}
                </span>
                <span className="mono-label mt-1.5 block text-muted-2">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </header>

        {/* ---- The grammar ---- */}
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-2 border-b-2 border-ink pb-3">
            <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-accent-strong">
              /00
            </span>
            <h2 className="font-display text-[clamp(1.35rem,3.5vw,1.9rem)] font-bold uppercase leading-none tracking-[-0.03em]">
              How to read this path
            </h2>
          </div>
          <p className="mb-4 max-w-(--soc-measure) font-mono text-[11.5px] leading-relaxed text-muted-2">
            {
              "// One convention runs through all 15 modules and every diagram. Learn it here and the rest reads itself."
            }
          </p>
          <VerificationLegend />

          <Link
            href="/ai-soc-prep/when-not-to-use-ai"
            className="mt-4 flex items-center justify-between gap-3 rounded-md border-[1.5px] border-(--ai-unverified) bg-(--ai-unverified)/5 px-4 py-3.5 transition-colors hover:bg-(--ai-unverified)/10"
          >
            <span>
              <span className="mono-label block text-(--ai-unverified)">
                READ THIS BEFORE ANYTHING ELSE
              </span>
              <span className="text-[13.5px] text-muted-2">
                When <b className="font-medium text-ink">not</b> to use AI — the
                six places it has no business being.
              </span>
            </span>
            <span aria-hidden className="font-mono text-[18px] text-(--ai-unverified)">
              →
            </span>
          </Link>
        </section>

        {/* ---- START HERE ---- */}
        <section className="mt-14">
          <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-2 border-b-2 border-ink pb-3">
            <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-accent-strong">
              /01
            </span>
            <h2 className="font-display text-[clamp(1.35rem,3.5vw,1.9rem)] font-bold uppercase leading-none tracking-[-0.03em]">
              Start here
            </h2>
            <span className="mono-label ml-auto text-faint">
              {hydrated ? `${done.size} / ${MODULE_COUNT} done` : `${MODULE_COUNT} modules`}
            </span>
          </div>
          <p className="mb-6 max-w-(--soc-measure) font-mono text-[11.5px] leading-relaxed text-muted-2">
            {
              "// In order. Each module is self-contained but the later ones assume the earlier ones — module 07 in particular is the gate to every project."
            }
          </p>

          <div className="space-y-9">
            {MODULES_BY_BLOCK.map(({ block, label, modules }) => (
              <div key={block}>
                <h3 className="mono-label mb-3 flex items-center gap-3 text-accent-strong">
                  {label.toUpperCase()}
                  <span aria-hidden className="h-px flex-1 bg-hairline" />
                  <span className="text-faint">
                    {modules.length === 1
                      ? `MODULE ${modules[0].n}`
                      : `MODULES ${modules[0].n}–${modules[modules.length - 1].n}`}
                  </span>
                </h3>
                <ul className="space-y-2">
                  {modules.map((m) => (
                    <ModuleCard
                      key={m.n}
                      module={m}
                      done={done.has(m.n)}
                      onToggle={() => toggle(m.n)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Supporting pages ---- */}
        <section className="mt-14">
          <h3 className="mono-label mb-4 text-accent-strong">ALSO ON THIS PATH</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/ai-soc-prep/projects"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">PROJECTS →</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                Ten hands-on builds, from a first local inference to an eval harness that measures your own assistant.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/quiz"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">QUIZ →</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                142 questions — 8 per module plus a final exam gated behind them. Every answer teaches.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/prompts"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">PROMPT LIBRARY →</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                Tested, copy-paste prompts with output schemas and known failure modes. The page you bookmark.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/datasets"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">DATASETS &amp; FREE LABS →</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                Every dataset the projects run on, with licence and load code. All public, so anyone can reproduce the work.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/cost"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">COST &amp; ARCHITECTURE →</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                Token maths, local vs hosted, the latency budget, and when a 7B model is genuinely enough.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/glossary"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">GLOSSARY →</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                Plain-English definitions of the jargon, each with why a SOC analyst cares.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/careers"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">CAREERS &amp; INTERVIEW →</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                25 likely questions, how to answer them, and the measured sentence that ends an interview in your favour.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/resources"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">RESOURCES →</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                YouTube, free courses, GitHub and reading — each with a one-line reason it earns a place.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/lab-safety"
              className="rounded-md border-[1.5px] border-(--ai-unverified)/40 bg-surface px-4 py-3.5 transition-colors hover:border-(--ai-unverified)"
            >
              <span className="mono-label block text-(--ai-unverified)">LAB SAFETY ⚠</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                Read before any malware work — the isolated-lab rules modules 11–12 and project 06 depend on.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/internal"
              className="rounded-md border border-dashed border-hairline bg-surface-alt px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-faint">INTERNAL ANNEXES ⌁</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                Environment-specific notes alongside the public modules. Password required.
              </span>
            </Link>
          </div>
        </section>

        {/* ---- Sibling paths ---- */}
        <section className="mt-14 border-t border-hairline pt-8">
          <h3 className="mono-label mb-4 text-accent-strong">
            THE OTHER TWO PATHS
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                href: "/soc-prep",
                label: "SOC PREP",
                blurb:
                  "L1/L2/L3 fundamentals, 50 scenarios, 12 projects. Start here if AI is not yet the problem.",
              },
              {
                href: "/cloud-security-prep",
                label: "CLOUD SECURITY PREP",
                blurb:
                  "AWS, Azure and GCP across Associate to Architect. 12 projects with per-cloud steps.",
              },
            ].map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
              >
                <span className="mono-label block text-accent-strong">
                  {p.label} →
                </span>
                <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                  {p.blurb}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export { BLOCK_NAMES, MODULES };
export type { Block };
