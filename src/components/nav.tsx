"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "INDEX", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "PROJECTS", href: "/projects" },
  { label: "EXPERIENCE", href: "/experience" },
  { label: "BLOG", href: "/blog" },
];

/**
 * The prep paths, surfaced under one LEARNING menu so every learning track is a
 * click away from anywhere on the site. AI SOC leads because it is the newest
 * and most complete. Order here is the order shown.
 */
const LEARNING = [
  {
    label: "AI SOC Analyst",
    href: "/ai-soc-prep",
    blurb: "AI as an evidence layer — 15 modules, 10 projects, a 142-question quiz.",
    tag: "NEW",
  },
  {
    label: "SOC Analyst",
    href: "/soc-prep",
    blurb: "L1/L2/L3 fundamentals, 50 scenarios and 12 hands-on projects.",
  },
  {
    label: "Cloud Security",
    href: "/cloud-security-prep",
    blurb: "AWS · Azure · GCP, Associate through Architect, 12 projects.",
  },
  {
    label: "SEO",
    href: "/seo-prep",
    blurb: "Search fundamentals and technical SEO.",
  },
];
const LEARNING_PATHS = LEARNING.map((l) => l.href);

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
  const [learnOpen, setLearnOpen] = useState(false);
  const learnRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const learnActive = LEARNING_PATHS.some((h) => pathname.startsWith(h));

  // Close the LEARNING dropdown on an outside click or Escape. setState lives
  // in the event callbacks, not the effect body, so this stays side-effect-safe.
  useEffect(() => {
    if (!learnOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (learnRef.current && !learnRef.current.contains(e.target as Node)) {
        setLearnOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLearnOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [learnOpen]);

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

          {/* LEARNING dropdown */}
          <div className="relative" ref={learnRef}>
            <button
              type="button"
              onClick={() => setLearnOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={learnOpen}
              className={`mono-label inline-flex items-center gap-1 rounded-pill px-3 py-1.5 transition-colors ${
                learnActive || learnOpen
                  ? "bg-ink text-paper"
                  : "text-muted-2 hover:text-ink"
              }`}
            >
              LEARNING
              <span
                aria-hidden
                className={`text-[8px] leading-none transition-transform ${
                  learnOpen ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {learnOpen && (
              <div
                role="menu"
                className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border-[1.5px] border-ink bg-surface p-1.5 shadow-xl"
              >
                {LEARNING.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    role="menuitem"
                    onClick={() => setLearnOpen(false)}
                    className={`block rounded-md px-3 py-2 transition-colors hover:bg-surface-alt ${
                      pathname.startsWith(l.href) ? "bg-surface-alt" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">
                        {l.label}
                      </span>
                      {l.tag && (
                        <span className="mono-label rounded-pill bg-accent px-1.5 py-px text-[9px] font-semibold text-paper">
                          {l.tag}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-2">
                      {l.blurb}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
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

          {/* LEARNING group */}
          <div className="mt-1 border-t border-hairline pt-1">
            <span className="mono-label block px-3 py-2 text-faint">
              LEARNING
            </span>
            {LEARNING.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-pill px-3 py-2.5 text-[14px] ${
                  pathname.startsWith(l.href)
                    ? "bg-ink text-paper"
                    : "text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  {l.label}
                  {l.tag && (
                    <span className="mono-label rounded-pill bg-accent px-1.5 py-px text-[9px] font-semibold text-paper">
                      {l.tag}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>

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
