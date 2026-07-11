"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { label: "INDEX", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "PROJECTS", href: "/projects" },
  { label: "EXPERIENCE", href: "/experience" },
  { label: "BLOG", href: "/blog" },
];

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  };

  return { dark, toggle };
}

export function Nav({
  wordmark,
  logo = null,
}: {
  wordmark: string;
  logo?: string | null;
}) {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="sticky top-4 z-50 px-4 sm:px-5">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-pill border-[1.5px] border-ink bg-surface px-3 py-2 sm:px-4">
        {/* Wordmark (or uploaded logo) */}
        <Link href="/" className="flex items-center font-display text-[15px] font-bold tracking-tight text-ink">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={wordmark} className="h-7 w-auto" />
          ) : (
            <>
              {wordmark}
              <span className="text-accent">.</span>
            </>
          )}
        </Link>

        {/* Center pill links (desktop) */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`mono-label rounded-pill px-3 py-1.5 transition-colors ${
                isActive(l.href)
                  ? "bg-ink text-paper"
                  : "text-muted-2 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right: theme toggle + hire me */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid size-9 place-items-center rounded-pill border-[1.5px] border-hairline text-ink transition-colors hover:border-ink"
          >
            {dark ? "☀" : "☾"}
          </button>
          <Link
            href="/#hire"
            className="mono-label hidden rounded-pill bg-accent px-3 py-2 font-semibold text-paper transition-opacity hover:opacity-90 sm:inline-block"
          >
            HIRE ME →
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="grid size-9 place-items-center rounded-pill border-[1.5px] border-hairline text-ink md:hidden"
          >
            {menuOpen ? "✕" : "≡"}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      {menuOpen && (
        <div className="mx-auto mt-2 max-w-6xl rounded-lg border-[1.5px] border-ink bg-surface p-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`mono-label block rounded-pill px-3 py-3 ${
                isActive(l.href) ? "bg-ink text-paper" : "text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#hire"
            onClick={() => setMenuOpen(false)}
            className="mono-label mt-1 block rounded-pill bg-accent px-3 py-3 text-center font-semibold text-paper"
          >
            HIRE ME →
          </Link>
        </div>
      )}
    </div>
  );
}
