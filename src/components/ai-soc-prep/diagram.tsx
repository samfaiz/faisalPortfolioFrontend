"use client";

import { useState } from "react";

/**
 * A module diagram. Renders the WebP from /public/ai-soc-prep/diagrams/ when it
 * exists, and falls back to a labelled slot when it does not — so partial
 * delivery never shows a broken image. The fallback also names the file, which
 * is useful while diagrams are still landing.
 *
 * Client component only because it needs onError; the rest of the module page
 * is server-rendered.
 */
export function ModuleDiagram({
  src,
  alt,
  file,
}: {
  src: string;
  alt: string;
  file: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <figure className="rounded-lg border-[1.5px] border-dashed border-hairline bg-surface-alt px-5 py-8 text-center">
        <span className="mono-label block text-faint">DIAGRAM · {file}</span>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-2">
          Not yet generated.
        </p>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-lg border-[1.5px] border-hairline bg-surface-alt">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full"
        onError={() => setFailed(true)}
      />
      <figcaption className="border-t border-hairline px-4 py-2.5 font-mono text-[10.5px] leading-relaxed text-muted-2">
        {alt}
      </figcaption>
    </figure>
  );
}
