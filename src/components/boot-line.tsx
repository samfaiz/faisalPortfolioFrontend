"use client";

import { useEffect, useState } from "react";

/** Terminal boot line with a type-on effect, then a steady blinking caret. */
export function BootLine({ text }: { text: string }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
  }, [text]);

  return (
    <span className="mono-label inline-flex items-center gap-1 rounded-pill border-[1.5px] border-hairline bg-surface px-3 py-1.5 text-muted">
      <span>{shown}</span>
      <span className="animate-blink inline-block h-3 w-[7px] bg-accent" aria-hidden />
    </span>
  );
}
