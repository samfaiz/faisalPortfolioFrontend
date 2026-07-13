import type { SiteSettings } from "@/lib/types";

/**
 * View + Download buttons for the resume. "View" opens the PDF inline in a new
 * tab; "Download" hits the backend endpoint that forces a file download.
 * Falls back to /resume.pdf if nothing is uploaded yet.
 */
export function ResumeActions({
  settings,
  variant = "light",
}: {
  settings: Pick<SiteSettings, "resume_url" | "resume_download">;
  variant?: "light" | "dark";
}) {
  const view = settings.resume_url || "/resume.pdf";
  const download = settings.resume_download || settings.resume_url || "/resume.pdf";

  const base = "mono-label rounded-pill px-4 py-2.5 font-semibold transition-colors";
  const styles =
    variant === "dark"
      ? { view: "bg-accent text-paper hover:opacity-90", download: "border border-on-dark-faint/40 text-on-dark hover:border-accent-soft" }
      : { view: "bg-ink text-paper hover:opacity-90", download: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-paper" };

  return (
    <div className="flex flex-wrap gap-2">
      <a href={view} target="_blank" rel="noopener noreferrer" className={`${base} ${styles.view}`}>
        VIEW RESUME ↗
      </a>
      <a href={download} className={`${base} ${styles.download}`}>
        DOWNLOAD ↓
      </a>
    </div>
  );
}
