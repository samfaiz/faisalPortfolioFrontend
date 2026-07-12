/**
 * Phase 3 — Code rich block. Renders a fenced code block with an optional
 * language label. Syntax highlighting is added when TipTap's CodeBlockLowlight
 * (or a public highlighter like Shiki) is wired — see frontend/PHASE_3_SCAFFOLD.md.
 */

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <figure className="my-5 overflow-hidden rounded-md border border-hairline bg-panel">
      <figcaption className="mono-label flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-on-dark-muted">
        <span>{language ?? "code"}</span>
      </figcaption>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-on-dark">
        <code className="font-mono">{code}</code>
      </pre>
    </figure>
  );
}
