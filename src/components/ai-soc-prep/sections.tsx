import type { Callout, Section } from "@/lib/ai-soc-prep/data";

/**
 * Renders written module content.
 *
 * Server component — all static. The one interactive thing a reader wants here
 * is copyable code, and native selection already does that; a copy button would
 * mean shipping JS to every module page for marginal gain.
 */

/** Callout styling follows the path's grammar: blue = model, green = verified. */
const CALLOUT: Record<Callout["kind"], { border: string; text: string; mark: string }> = {
  model: { border: "border-(--ai-model)", text: "text-(--ai-model)", mark: "▚" },
  verified: { border: "border-(--ai-verified)", text: "text-(--ai-verified)", mark: "✓" },
  review: { border: "border-(--ai-review)", text: "text-(--ai-review)", mark: "◆" },
  warn: { border: "border-(--ai-unverified)", text: "text-(--ai-unverified)", mark: "⚠" },
};

function CalloutBox({ callout: c }: { callout: Callout }) {
  const s = CALLOUT[c.kind];
  // Model output is dashed, everything else solid — the same visual rule the
  // diagrams use, so the two never contradict each other.
  const dash = c.kind === "model" ? "border-dashed" : "";
  return (
    <div
      className={`my-4 max-w-(--soc-measure) rounded-md border-[1.5px] ${s.border} ${dash} bg-surface-alt px-4 py-3.5`}
    >
      <span className={`mono-label mb-1.5 block ${s.text}`}>
        {s.mark} {c.title}
      </span>
      <p className="soc-prose">{c.body}</p>
    </div>
  );
}

function CodeBlock({
  lang,
  label,
  code,
}: {
  lang?: string;
  label?: string;
  code: string;
}) {
  return (
    <div className="my-4 overflow-hidden rounded-md border border-hairline bg-surface-alt">
      {(lang || label) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-3 py-1.5">
          {lang && <span className="mono-label text-accent-strong">{lang}</span>}
          {label && (
            <span className="font-mono text-[10.5px] text-muted-2">{label}</span>
          )}
        </div>
      )}
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-[1.7] text-ink">
        {code}
      </pre>
    </div>
  );
}

/**
 * KQL and SPL side by side. Both are first-class on this path: a reader
 * arriving from /soc-prep knows SPL, a reader working in Sentinel knows KQL,
 * and showing one while hand-waving the other strands half the audience.
 */
function QueryPairBlock({ kql, spl, note }: { kql?: string; spl?: string; note?: string }) {
  return (
    <div className="my-4">
      {note && (
        <p className="mb-2 max-w-(--soc-measure) font-mono text-[11.5px] leading-relaxed text-muted-2">
          {note}
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {kql && <CodeBlock lang="KQL" label="Sentinel / Defender" code={kql} />}
        {spl && <CodeBlock lang="SPL" label="Splunk" code={spl} />}
      </div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-ink">
            {headers.map((h) => (
              <th key={h} className="mono-label px-3 py-2 text-accent-strong">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-divider align-top">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2.5 text-[13.5px] leading-relaxed ${
                    j === 0 ? "font-medium text-ink" : "text-muted-2"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ModuleSections({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-10">
      {sections.map((s, i) => (
        <section key={i} id={`s${i + 1}`} className="scroll-mt-24">
          <h2 className="font-display text-[clamp(1.25rem,3vw,1.6rem)] font-bold leading-tight tracking-[-0.025em]">
            {s.heading}
          </h2>
          <div
            className="soc-prose mt-3 max-w-(--soc-measure)"
            dangerouslySetInnerHTML={{ __html: s.body }}
          />
          {s.table && <Table headers={s.table.headers} rows={s.table.rows} />}
          {s.code && <CodeBlock {...s.code} />}
          {s.queries && <QueryPairBlock {...s.queries} />}
          {s.callout && <CalloutBox callout={s.callout} />}
        </section>
      ))}
    </div>
  );
}

/** Jump list — 15 modules of dense content need one. */
export function SectionNav({ sections }: { sections: Section[] }) {
  return (
    <nav
      aria-label="On this page"
      className="soc-noprint rounded-lg border border-hairline bg-surface-alt px-4 py-3.5"
    >
      <span className="mono-label mb-2 block text-accent-strong">
        ON THIS PAGE
      </span>
      <ol className="space-y-1.5">
        {sections.map((s, i) => (
          <li key={i} className="flex gap-2.5">
            <span aria-hidden className="font-mono text-[11px] text-faint">
              {String(i + 1).padStart(2, "0")}
            </span>
            <a
              href={`#s${i + 1}`}
              className="text-[13.5px] leading-snug text-muted-2 transition-colors hover:text-ink"
            >
              {s.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
