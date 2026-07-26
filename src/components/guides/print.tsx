"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Print / save-as-PDF helpers shared by the prep kits and the project guides.
 *
 * Two things need doing that CSS alone cannot:
 *
 *   1. `<details>` elements (troubleshooting blocks, glossaries) cannot be
 *      forced open from a stylesheet. They have to be opened in JS before the
 *      print dialog paints and restored afterwards.
 *   2. Printing one section of a long page needs the other sections hidden.
 *      A body-level attribute plus a marker on the target lets the print
 *      stylesheet do that without any component knowing about the others.
 *
 * Both hook into `beforeprint`/`afterprint` so Ctrl+P behaves exactly like the
 * on-page button.
 */

/** Open every <details> for printing, then put them back as they were. */
export function useExpandOnPrint() {
  useEffect(() => {
    let restore: (() => void)[] = [];

    const onBefore = () => {
      restore = [];
      document.querySelectorAll("details").forEach((d) => {
        if (d.open) return;
        d.open = true;
        restore.push(() => {
          d.open = false;
        });
      });
    };

    const onAfter = () => {
      restore.forEach((fn) => fn());
      restore = [];
    };

    window.addEventListener("beforeprint", onBefore);
    window.addEventListener("afterprint", onAfter);
    return () => {
      window.removeEventListener("beforeprint", onBefore);
      window.removeEventListener("afterprint", onAfter);
      onAfter();
    };
  }, []);
}

/**
 * Print one section of the page. Falls back to printing everything if the
 * section is missing, which is better than doing nothing.
 *
 * Safari and Firefox fire `afterprint` reliably; Chrome does too, but only
 * once the dialog closes. The cleanup is idempotent either way.
 */
export function printSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) {
    window.print();
    return;
  }

  el.setAttribute("data-print-target", "");
  document.body.setAttribute("data-print-scope", "");

  const cleanup = () => {
    el.removeAttribute("data-print-target");
    document.body.removeAttribute("data-print-scope");
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.print();

  // Belt and braces: if afterprint never fires (some mobile browsers), don't
  // leave the page with half of it hidden.
  setTimeout(cleanup, 60_000);
}

export function PrintButton({
  /** Section id to print on its own. Omit to print the whole page. */
  scope,
  label = "PRINT / PDF",
  className,
  title,
}: {
  scope?: string;
  label?: string;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => (scope ? printSection(scope) : window.print())}
      title={title ?? (scope ? `Print this section or save it as a PDF` : "Print or save as PDF")}
      className={cn(
        "soc-noprint mono-label inline-flex items-center gap-1.5 rounded-pill border-[1.5px] border-hairline px-3 py-1.5 text-muted-2 transition-colors hover:border-ink hover:text-ink",
        className
      )}
    >
      <span aria-hidden>⎙</span>
      {label}
    </button>
  );
}
