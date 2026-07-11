/**
 * Phase 3 — Image rich block with optional caption. Uses a plain <img> so it works
 * for arbitrary CMS media URLs; swap for next/image where the domain is configured.
 */

export function ImageBlock({
  src,
  alt,
  caption,
}: {
  src: string;
  alt?: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? caption ?? ""}
        className="w-full rounded-md border border-hairline"
        loading="lazy"
      />
      {caption ? (
        <figcaption className="mono-label mt-2 text-center text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
