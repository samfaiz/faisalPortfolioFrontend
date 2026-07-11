/**
 * Phase 3 — Embed rich block (YouTube / CodePen / gist / generic iframe).
 *
 * Providers are allow-listed; unknown hosts fall back to a "open in new tab" card
 * (mirrors the live-project iframe fallback strategy from the design handoff).
 */

type EmbedProvider = "youtube" | "codepen" | "generic";

function classify(url: string): EmbedProvider {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/codepen\.io/.test(url)) return "codepen";
  return "generic";
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return m ? m[1] : null;
}

export function EmbedBlock({ url, title }: { url: string; title?: string }) {
  const provider = classify(url);

  if (provider === "youtube") {
    const id = youtubeId(url);
    if (id) {
      return (
        <div className="my-5 aspect-video overflow-hidden rounded-md border border-hairline">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={title ?? "YouTube video"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  // Generic / unknown: safe fallback card rather than an unsandboxed iframe.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-5 flex items-center justify-between gap-3 rounded-md border border-hairline bg-surface-alt/60 px-4 py-3 no-underline transition-colors hover:border-accent"
    >
      <span className="min-w-0">
        <span className="mono-label block text-muted">EMBED · {provider}</span>
        <span className="block truncate text-ink">{title ?? url}</span>
      </span>
      <span className="mono-label shrink-0 text-accent">OPEN ↗</span>
    </a>
  );
}
