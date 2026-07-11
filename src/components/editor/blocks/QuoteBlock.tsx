/**
 * Phase 3 — Blockquote rich block with optional attribution.
 */
import type { ReactNode } from "react";

export function QuoteBlock({ cite, children }: { cite?: string; children?: ReactNode }) {
  return (
    <blockquote className="my-5 border-l-2 border-accent pl-4">
      <div className="text-lg italic text-ink [&_p]:my-1">{children}</div>
      {cite ? <cite className="mono-label mt-2 block not-italic text-muted">— {cite}</cite> : null}
    </blockquote>
  );
}
