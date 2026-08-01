import Link from "next/link";
import { ModuleSections, SectionNav } from "./sections";
import { aiSocProjectByNumber } from "@/lib/ai-soc-prep/projects";
import {
  BLOCK_NAMES,
  MODULES,
  MODULE_COUNT,
  type Module,
} from "@/lib/ai-soc-prep/data";

/**
 * Module page.
 *
 * At milestone 1 these are shells: title, objectives, the outline of what the
 * full page will cover, and the verify-it exercise. The outline is shown rather
 * than hidden — it tells a reader what is coming and lets Faisal check the
 * structure before 3,000 words go into each one.
 *
 * A server component; nothing here is interactive.
 */

function DiagramSlot({ module: m }: { module: Module }) {
  // Diagrams land incrementally. Rather than a broken image, the slot states
  // what the diagram will show — which is useful on its own.
  return (
    <figure className="rounded-lg border-[1.5px] border-dashed border-hairline bg-surface-alt px-5 py-8 text-center">
      <span className="mono-label block text-faint">
        DIAGRAM · {m.diagram}
      </span>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-2">
        Not yet generated.
      </p>
    </figure>
  );
}

export function AiSocModulePage({ module: m }: { module: Module }) {
  const prev = MODULES.find((x) => x.n === m.n - 1) ?? null;
  const next = MODULES.find((x) => x.n === m.n + 1) ?? null;

  return (
    <div className="soc-page min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-225 px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        <Link
          href="/ai-soc-prep"
          className="mono-label soc-noprint inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
        >
          ← BACK TO AI SOC ANALYST
        </Link>

        {/* ---- Header ---- */}
        <header className="mt-6 border-b-2 border-ink pb-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label text-accent-strong">
              MODULE {String(m.n).padStart(2, "0")} / {MODULE_COUNT}
            </span>
            <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
              {BLOCK_NAMES[m.block].toUpperCase()}
            </span>
            <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
              {m.minutes} MIN
            </span>
          </div>

          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            {m.title}
          </h1>
          <p className="mt-3 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            {m.summary}
          </p>
        </header>

        {/* ---- Why it's here (only where it earns a line) ---- */}
        {m.whyItsHere && (
          <div className="mt-8 max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-4">
            <span className="mono-label mb-2 block text-accent-strong">
              Why this module exists
            </span>
            <p className="soc-prose">{m.whyItsHere}</p>
          </div>
        )}

        {/* ---- Objectives ---- */}
        <section className="mt-10 space-y-2">
          <h2 className="mono-label flex items-center gap-3 text-accent-strong">
            What you&rsquo;ll be able to do
            <span aria-hidden className="h-px flex-1 bg-hairline" />
          </h2>
          <ul className="soc-prose max-w-(--soc-measure) space-y-1.5">
            {m.objectives.map((o, i) => (
              <li key={i} className="flex gap-2.5">
                <span aria-hidden className="text-accent-strong">
                  →
                </span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Written content, when the module has it ---- */}
        {m.sections && m.sections.length > 0 && (
          <>
            <div className="mt-10 max-w-(--soc-measure)">
              <SectionNav sections={m.sections} />
            </div>
            <div className="mt-10">
              <ModuleSections sections={m.sections} />
            </div>
          </>
        )}

        {/* ---- Outline — shells only. A written module has real headings. ---- */}
        {!m.sections && (
        <section className="mt-10 space-y-3">
          <h2 className="mono-label flex items-center gap-3 text-accent-strong">
            What this module covers
            <span aria-hidden className="h-px flex-1 bg-hairline" />
            <span className="text-faint">{m.outline.length} SECTIONS</span>
          </h2>
          <ol className="space-y-2">
            {m.outline.map((section, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-md border border-hairline bg-surface px-4 py-3"
              >
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 font-mono text-[11px] font-bold text-faint"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[14.5px] leading-relaxed text-ink">
                  {section}
                </span>
              </li>
            ))}
          </ol>
        </section>
        )}

        {/* ---- Diagram ---- */}
        <section className="mt-10">
          <DiagramSlot module={m} />
        </section>

        {/* ---- Verify it — the discipline that defines the path ---- */}
        <section className="mt-10">
          <div className="max-w-(--soc-measure) rounded-md border-[1.5px] border-(--ai-verified) bg-(--ai-verified)/5 px-5 py-4">
            <span className="mono-label mb-2 block text-(--ai-verified)">
              ✓ VERIFY IT
            </span>
            <p className="soc-prose">{m.verifyIt}</p>
            <p className="mt-3 font-mono text-[11.5px] leading-relaxed text-muted-2">
              {
                "// Every module closes with one of these. The exercise is always the same question in a different costume: how do you know the model didn't make this up?"
              }
            </p>
          </div>
        </section>

        {/* ---- Related projects ---- */}
        {m.projects.length > 0 && (
          <section className="mt-10 space-y-2">
            <h2 className="mono-label flex items-center gap-3 text-accent-strong">
              Where you use this
              <span aria-hidden className="h-px flex-1 bg-hairline" />
            </h2>
            <ul className="space-y-2">
              {m.projects.map((n) => {
                const p = aiSocProjectByNumber(n);
                return (
                  <li key={n}>
                    {p?.built ? (
                      <Link
                        href={`/ai-soc-prep/projects/${p.slug}`}
                        className="flex items-center justify-between gap-3 rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3 transition-colors hover:border-ink"
                      >
                        <span>
                          <span className="mono-label block text-accent-strong">
                            PROJECT {String(n).padStart(2, "0")}
                          </span>
                          <span className="text-[14px] text-ink">{p.title}</span>
                        </span>
                        <span aria-hidden className="font-mono text-[16px] text-accent-strong">→</span>
                      </Link>
                    ) : (
                      <span className="block rounded-md border border-dashed border-hairline px-4 py-3">
                        <span className="mono-label block text-faint">
                          PROJECT {String(n).padStart(2, "0")} · NOT BUILT YET
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ---- Status — shells only ---- */}
        {!m.sections && (
        <section className="mt-10">
          <div className="max-w-(--soc-measure) rounded-md border border-dashed border-hairline bg-surface-alt px-4 py-3.5">
            <span className="mono-label block text-faint">
              MILESTONE 1 — STRUCTURE
            </span>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-2">
              This is the module shell. Objectives, outline and the verify-it
              exercise are final; the written content and diagram land in a later
              milestone.
            </p>
          </div>
        </section>
        )}

        {/* ---- Internal annex pointer (public: link only, never content) ---- */}
        {(m.annex?.length ?? 0) > 0 && (
          <section className="soc-noprint mt-10">
            <Link
              href={`/ai-soc-prep/internal/${m.slug}`}
              className="flex max-w-(--soc-measure) items-center justify-between gap-3 rounded-md border border-dashed border-hairline bg-surface-alt px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span>
                <span className="mono-label block text-faint">
                  INTERNAL ANNEX · {m.annex!.length} NOTE
                  {m.annex!.length === 1 ? "" : "S"}
                </span>
                <span className="text-[13.5px] text-muted-2">
                  Environment-specific notes. Password required.
                </span>
              </span>
              <span aria-hidden className="font-mono text-[16px] text-faint">
                ⌁
              </span>
            </Link>
          </section>
        )}

        {/* ---- Prev / next ---- */}
        <nav className="soc-noprint mt-14 flex flex-wrap gap-3 border-t border-hairline pt-6">
          {prev ? (
            <Link
              href={`/ai-soc-prep/module/${prev.slug}`}
              className="flex-1 rounded-md border-[1.5px] border-hairline px-4 py-3 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-faint">
                ← MODULE {String(prev.n).padStart(2, "0")}
              </span>
              <span className="mt-0.5 block text-[14px] font-medium text-ink">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next && (
            <Link
              href={`/ai-soc-prep/module/${next.slug}`}
              className="flex-1 rounded-md border-[1.5px] border-hairline px-4 py-3 text-right transition-colors hover:border-ink"
            >
              <span className="mono-label block text-faint">
                MODULE {String(next.n).padStart(2, "0")} →
              </span>
              <span className="mt-0.5 block text-[14px] font-medium text-ink">
                {next.title}
              </span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
