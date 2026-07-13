"use client";

/**
 * ResumeViewer — an eye button that opens the resume in an in-page lightbox
 * (the PDF embedded in an iframe) with Download + close controls. Closes on the
 * ✕, a backdrop click, or Escape; locks page scroll while open. Shows a
 * "View resume" tooltip on hover.
 */
import { useEffect, useState } from "react";

export function ResumeViewer({
  viewUrl,
  downloadUrl,
}: {
  viewUrl: string;
  downloadUrl?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View resume"
        className="group relative grid size-10 shrink-0 place-items-center rounded-pill border-[1.5px] border-ink text-ink transition-colors hover:bg-ink hover:text-paper sm:size-12"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {/* Hover tooltip */}
        <span className="mono-label pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill bg-ink px-2.5 py-1 text-paper opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          View resume
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 sm:p-6"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Resume"
        >
          <div
            className="flex h-full w-full flex-col overflow-hidden border-ink bg-surface sm:h-[88vh] sm:max-w-4xl sm:rounded-lg sm:border-2 sm:shadow-offset"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center gap-3 border-b-[1.5px] border-hairline bg-surface-alt px-4 py-3">
              <span className="mono-label text-ink">RESUME</span>
              <div className="ml-auto flex items-center gap-2">
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    className="mono-label rounded-pill border-[1.5px] border-ink px-3 py-1.5 text-ink transition-colors hover:bg-ink hover:text-paper"
                  >
                    DOWNLOAD ↓
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  title="Close (Esc)"
                  className="grid size-9 place-items-center rounded-pill border-[1.5px] border-hairline text-ink transition-colors hover:border-ink"
                >
                  ✕
                </button>
              </div>
            </header>
            <iframe src={viewUrl} title="Resume" className="min-h-0 w-full flex-1 bg-white" />
          </div>
        </div>
      )}
    </>
  );
}
