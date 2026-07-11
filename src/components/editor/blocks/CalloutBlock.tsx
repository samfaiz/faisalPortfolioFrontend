/**
 * Phase 3 — Callout rich block (note / tip / warning / danger).
 *
 * Dual purpose: (1) the public renderer for stored callout nodes, and (2) the
 * TipTap NodeView body once the editor is wired (see frontend/PHASE_3_SCAFFOLD.md).
 * Pure presentational — styled with the design tokens from app/globals.css.
 */
import type { ReactNode } from "react";
import type { CalloutTone } from "@/lib/editor/blocks";

const TONES: Record<CalloutTone, { label: string; ring: string; dot: string }> = {
  note: { label: "NOTE", ring: "border-hairline", dot: "bg-muted" },
  tip: { label: "TIP", ring: "border-accent", dot: "bg-accent" },
  warning: { label: "WARNING", ring: "border-amber-500", dot: "bg-amber-500" },
  danger: { label: "DANGER", ring: "border-red-500", dot: "bg-red-500" },
};

export function CalloutBlock({
  tone = "note",
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children?: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <aside className={`my-5 rounded-md border-l-2 ${t.ring} bg-surface-alt/60 px-4 py-3`}>
      <p className="mono-label flex items-center gap-2 text-muted">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${t.dot}`} aria-hidden />
        {title ?? t.label}
      </p>
      <div className="mt-1.5 text-ink [&_p]:my-1">{children}</div>
    </aside>
  );
}
