"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Accordion } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FUNDAMENTALS,
  FUNDAMENTAL_COUNT,
  LEVEL_NAMES,
  ROLES,
  type Level,
  type Pillar,
} from "@/lib/seo-prep/data";
import { RESOURCES, RESOURCE_COUNT } from "@/lib/seo-prep/resources";
import { speech, useActiveTopic } from "@/components/soc-prep/speech";
import { SocAssistant } from "@/components/soc-prep/assistant";
import { ResourceGroupList } from "@/components/soc-prep/parts";
import { PrintButton } from "@/components/guides/print";
import { EmptyNote, FundamentalCard, RoleCard } from "./parts";

/* ------------------------------------------------------------------ */
/* Static derivations                                                  */
/* ------------------------------------------------------------------ */

const strip = (h: string) =>
  h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").toLowerCase();

const FUNDAMENTAL_TEXT = FUNDAMENTALS.map((f) =>
  strip(
    [f.title, f.category, f.plain, f.detail, f.realWorld, f.pitfall ?? ""].join(
      " "
    )
  )
);

const FUNDAMENTAL_CATS = [...new Set(FUNDAMENTALS.map((f) => f.category))];

const PILLARS: Pillar[] = ["technical", "content", "authority", "measurement"];

const SECTIONS = [
  { id: "fundamentals", num: "/01", label: "FUNDAMENTALS" },
  { id: "roles", num: "/02", label: "ROLES" },
  { id: "resources", num: "/03", label: "RESOURCES" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
type LevelFilter = "all" | Level;
type PillarFilter = "all" | Pillar;
type ReadingSize = "base" | "lg" | "xl";

const READ_KEY = "seo-prep:read";
const SIZE_KEY = "seo-prep:size";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // One-time sync with the class the pre-paint theme script set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

/** Keep a just-opened card clear of the sticky control bar. */
function keepInView(domId: string) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = document.getElementById(domId);
      if (!el) return;
      const bar = document.getElementById("seo-controls");
      const offset = (bar ? bar.getBoundingClientRect().bottom : 100) + 10;
      const top = el.getBoundingClientRect().top;
      if (top < offset || top > window.innerHeight * 0.5) {
        window.scrollTo({ top: top + window.scrollY - offset, behavior: "smooth" });
      }
    })
  );
}

function SectionHeader({
  num,
  title,
  count,
  action,
}: {
  num: string;
  title: string;
  count?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b-2 border-ink pb-3">
      <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-accent-strong">
        {num}
      </span>
      <h2 className="font-display text-[clamp(1.45rem,3.5vw,2.1rem)] font-bold uppercase leading-none tracking-[-0.03em]">
        {title}
      </h2>
      {action}
      <span className="mono-label ml-auto text-faint">{count}</span>
    </div>
  );
}

function CategoryPills({
  cats,
  counts,
  total,
  active,
  onChange,
  label,
}: {
  cats: string[];
  counts: Record<string, number>;
  total: number;
  active: string;
  onChange: (c: string) => void;
  label: string;
}) {
  const pill = (value: string, text: string) => (
    <button
      key={value}
      type="button"
      aria-pressed={active === value}
      onClick={() => onChange(value)}
      className={cn(
        "mono-label rounded-pill border-[1.5px] px-3 py-1.5 transition-colors",
        active === value
          ? "border-ink bg-ink text-paper"
          : "border-hairline text-muted-2 hover:border-ink hover:text-ink"
      )}
    >
      {text}
    </button>
  );
  return (
    <div
      role="group"
      aria-label={label}
      className="soc-noprint mb-5 flex flex-wrap gap-1.5"
    >
      {pill("all", `ALL ${total}`)}
      {cats.map((c) => pill(c, `${c.toUpperCase()} ${counts[c] ?? 0}`))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The kit                                                             */
/* ------------------------------------------------------------------ */

export function SeoPrepKit() {
  const { dark, toggle } = useTheme();
  const assistantOpen = useActiveTopic() !== null;

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [pillar, setPillar] = useState<PillarFilter>("all");
  const [cat, setCat] = useState("all");
  const [size, setSize] = useState<ReadingSize>("base");
  const [hydrated, setHydrated] = useState(false);

  const [openFund, setOpenFund] = useState<string[]>([]);
  const [read, setRead] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<SectionId>("fundamentals");

  const searchRef = useRef<HTMLInputElement>(null);

  /* ---- persistence ---- */
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(READ_KEY) ?? "[]");
      if (Array.isArray(r)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRead(new Set(r.filter((n) => typeof n === "number")));
      }
      const s = localStorage.getItem(SIZE_KEY);
      if (s === "lg" || s === "xl" || s === "base") {
        setSize(s);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...read]));
      localStorage.setItem(SIZE_KEY, size);
    } catch {}
  }, [read, size, hydrated]);

  /* ---- "/" focuses search, like the other kits ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---- scroll spy ---- */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id as SectionId);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const q = query.trim().toLowerCase();

  const visibleFundamentals = useMemo(
    () =>
      FUNDAMENTALS.map((f, i) => ({ f, i })).filter(
        ({ f, i }) =>
          (level === "all" || f.level === level) &&
          (pillar === "all" || f.pillar === pillar) &&
          (cat === "all" || f.category === cat) &&
          (!q || FUNDAMENTAL_TEXT[i].includes(q))
      ),
    [level, pillar, cat, q]
  );

  const catCounts = useMemo(
    () =>
      Object.fromEntries(
        FUNDAMENTAL_CATS.map((c) => [
          c,
          FUNDAMENTALS.filter(
            (f) =>
              f.category === c &&
              (level === "all" || f.level === level) &&
              (pillar === "all" || f.pillar === pillar)
          ).length,
        ])
      ),
    [level, pillar]
  );

  const visibleRoles = ROLES.filter((r) => level === "all" || r.level === level);

  const allOpen =
    visibleFundamentals.length > 0 &&
    openFund.length === visibleFundamentals.length;

  const toggleAll = () => {
    speech.stop();
    setOpenFund(allOpen ? [] : visibleFundamentals.map(({ i }) => `fn-${i}`));
  };

  const goTo = (id: SectionId) => {
    const el = document.getElementById(id);
    if (!el) return;
    const bar = document.getElementById("seo-controls");
    const offset = (bar ? bar.getBoundingClientRect().bottom : 100) + 10;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - offset,
      behavior: "smooth",
    });
  };

  return (
    <div className="soc-page" data-size={size === "base" ? undefined : size}>
      {/* ---- Skip link ---- */}
      <a
        href="#main"
        className="soc-noprint sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>

      {/* ---- Hero ---- */}
      <header className="px-4 pt-8 sm:px-5 md:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/"
              className="mono-label soc-noprint text-muted-2 transition-colors hover:text-ink"
            >
              ← FAISALKHAN.CLOUD
            </Link>
            <span className="mono-label text-faint">SEO INTERVIEW PREP</span>
          </div>

          <h1 className="mt-5 font-display text-[clamp(2rem,6vw,3.4rem)] font-bold leading-[1] tracking-[-0.04em]">
            SEO PREP<span className="text-accent-strong">.</span>
          </h1>

          <div className="mt-4 max-w-(--soc-measure) space-y-1 font-mono text-[12.5px] leading-[1.7] text-muted-2">
            <p>
              {"// "}
              <b className="font-medium text-ink">Technical-weighted</b> — half
              the material is crawling, indexing, rendering, and logs.
            </p>
            <p>
              {"// "}
              <b className="font-medium text-ink">Junior, Mid, and Senior</b> —
              filter everything to the level you are interviewing for.
            </p>
            <p>
              {"// Every tool used here is free. No trials, no paid tiers."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border-[1.5px] border-ink bg-hairline sm:grid-cols-3 lg:grid-cols-4">
            {[
              {
                n: FUNDAMENTAL_COUNT,
                label: "Fundamentals",
                href: "#fundamentals",
              },
              { n: ROLES.length, label: "Seniority levels", href: "#roles" },
              { n: RESOURCE_COUNT, label: "Free resources", href: "#resources" },
              { n: 0, label: "Free tools needed", href: "#resources" },
            ].map((m) => (
              <a
                key={m.label}
                href={m.href}
                className="bg-surface p-4 transition-colors hover:bg-surface-alt"
              >
                <span className="block font-display text-[26px] font-bold leading-none tracking-[-0.03em]">
                  {m.n === 0 ? "£0" : m.n}
                </span>
                <span className="mono-label mt-1.5 block text-muted-2">
                  {m.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ---- Sticky controls ---- */}
      <div
        id="seo-controls"
        className="soc-noprint sticky top-0 z-30 mt-8 border-y border-hairline bg-paper/95 backdrop-blur"
      >
        <div className="mx-auto max-w-6xl space-y-2.5 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-45 flex-1">
              <span
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-faint"
              >
                /
              </span>
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search — canonical, crawl budget, hreflang, E-E-A-T…"
                aria-label="Search the kit"
                className="rounded-pill border-[1.5px] pl-7 font-mono text-[12.5px]"
              />
            </div>

            <ToggleGroup
              type="single"
              value={level}
              onValueChange={(v) => v && setLevel(v as LevelFilter)}
              className="rounded-pill border-[1.5px] border-hairline p-0.5"
              aria-label="Filter by seniority"
            >
              {(["all", "junior", "mid", "senior"] as const).map((l) => (
                <ToggleGroupItem
                  key={l}
                  value={l}
                  className="mono-label rounded-pill px-3 data-[state=on]:bg-ink data-[state=on]:text-paper"
                >
                  {l === "all" ? "ALL" : LEVEL_NAMES[l].toUpperCase()}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="soc-noprint ml-auto flex items-center gap-1.5">
              <ToggleGroup
                type="single"
                value={size}
                onValueChange={(v) => v && setSize(v as ReadingSize)}
                className="rounded-pill border-[1.5px] border-hairline p-0.5"
                aria-label="Reading size"
              >
                <ToggleGroupItem value="base" className="mono-label rounded-pill px-2.5 data-[state=on]:bg-ink data-[state=on]:text-paper">
                  A
                </ToggleGroupItem>
                <ToggleGroupItem value="lg" className="mono-label rounded-pill px-2.5 data-[state=on]:bg-ink data-[state=on]:text-paper">
                  A+
                </ToggleGroupItem>
                <ToggleGroupItem value="xl" className="mono-label rounded-pill px-2.5 data-[state=on]:bg-ink data-[state=on]:text-paper">
                  A++
                </ToggleGroupItem>
              </ToggleGroup>

              <button
                type="button"
                onClick={() => window.print()}
                aria-label="Print or save as PDF"
                title="Print / save as PDF"
                className="hidden size-9 place-items-center rounded-pill border-[1.5px] border-hairline text-ink transition-colors hover:border-ink md:grid"
              >
                ⎙
              </button>
              <button
                type="button"
                onClick={toggle}
                aria-label="Toggle theme"
                className="grid size-9 place-items-center rounded-pill border-[1.5px] border-hairline text-ink transition-colors hover:border-ink"
              >
                {dark ? "☀" : "☾"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              type="single"
              value={pillar}
              onValueChange={(v) => v && setPillar(v as PillarFilter)}
              className="rounded-pill border-[1.5px] border-hairline p-0.5"
              aria-label="Filter by discipline"
            >
              <ToggleGroupItem value="all" className="mono-label rounded-pill px-3 data-[state=on]:bg-ink data-[state=on]:text-paper">
                ALL
              </ToggleGroupItem>
              {PILLARS.map((p) => (
                <ToggleGroupItem
                  key={p}
                  value={p}
                  className="mono-label rounded-pill px-3 data-[state=on]:bg-ink data-[state=on]:text-paper"
                >
                  {p === "content"
                    ? "CONTENT"
                    : p === "authority"
                      ? "OFF-PAGE"
                      : p.toUpperCase()}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <nav
              aria-label="Sections"
              className="ml-auto flex flex-wrap items-center gap-1"
            >
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  aria-current={active === s.id ? "true" : undefined}
                  className={cn(
                    "mono-label rounded-pill px-3 py-1.5 transition-colors",
                    active === s.id
                      ? "bg-ink text-paper"
                      : "text-muted-2 hover:text-ink"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ---- Sections ---- */}
      <main id="main" className="mx-auto max-w-6xl px-4 pb-24 sm:px-5">
        {/* /01 FUNDAMENTALS */}
        <section id="fundamentals" className="scroll-mt-28 pt-12 md:scroll-mt-40">
          <SectionHeader
            num="/01"
            title="Fundamentals"
            count={`${visibleFundamentals.length} / ${FUNDAMENTAL_COUNT} shown`}
            action={
              read.size > 0 ? (
                <span className="mono-label text-accent-strong">
                  ✓ {read.size} READ
                </span>
              ) : undefined
            }
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {
              "// Each one gives you the plain-English version first, then the depth an interviewer actually probes, then a real situation where it decides the outcome."
            }
          </p>

          <CategoryPills
            cats={FUNDAMENTAL_CATS}
            counts={catCounts}
            total={FUNDAMENTAL_COUNT}
            active={cat}
            onChange={setCat}
            label="Filter fundamentals by category"
          />

          <div className="soc-noprint mb-3 flex justify-end">
            <button
              type="button"
              onClick={toggleAll}
              className="mono-label rounded-pill border-[1.5px] border-hairline px-3 py-1.5 text-muted-2 transition-colors hover:border-ink hover:text-ink"
            >
              {allOpen ? "COLLAPSE ALL" : "EXPAND ALL"}
            </button>
          </div>

          <Accordion
            type="multiple"
            value={openFund}
            onValueChange={(v) => {
              speech.stop();
              const opened = v.find((x) => !openFund.includes(x));
              setOpenFund(v);
              if (opened) keepInView(`item-${opened}`);
            }}
          >
            {visibleFundamentals.map(({ f, i }) => (
              <FundamentalCard
                key={i}
                fundamental={f}
                index={i}
                read={read.has(i)}
                onToggleRead={() =>
                  setRead((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
              />
            ))}
          </Accordion>

          {visibleFundamentals.length === 0 && (
            <EmptyNote>
              Nothing matches. Clear the search or widen the filters.
            </EmptyNote>
          )}
        </section>

        {/* /02 ROLES */}
        <section id="roles" className="scroll-mt-28 pt-14 md:scroll-mt-40">
          <SectionHeader
            num="/02"
            title="Roles"
            count={`${visibleRoles.length} / ${ROLES.length} shown`}
            action={
              <PrintButton
                scope="roles"
                label="PRINT / PDF"
                title="Print just the roles, or save them as a PDF"
              />
            }
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {
              "// What each level is actually accountable for, and what the interview is really testing at that level."
            }
          </p>

          <div className="space-y-4">
            {visibleRoles.map((r) => (
              <RoleCard key={r.level} role={r} />
            ))}
          </div>

          {visibleRoles.length === 0 && (
            <EmptyNote>No roles match that filter.</EmptyNote>
          )}
        </section>

        {/* /03 RESOURCES */}
        <section id="resources" className="scroll-mt-28 pt-14 md:scroll-mt-40">
          <SectionHeader
            num="/03"
            title="Free Resources"
            count={`${RESOURCE_COUNT} free`}
          />
          <p className="mt-3 mb-6 font-mono text-[11.5px] text-muted-2">
            {
              "// The whole free stack, the primary documentation worth reading, and the few sources that are consistently right."
            }
          </p>
          {RESOURCES.map((g) => (
            <ResourceGroupList key={g.group} group={g} />
          ))}
        </section>
      </main>

      <footer className="border-t border-hairline px-4 py-8 text-center sm:px-5">
        <p className="font-mono text-[11.5px] text-muted-2">
          Built for interview prep · every tool free ·{" "}
          <Link href="/" className="underline hover:text-ink">
            faisalkhan.cloud
          </Link>
        </p>
      </footer>

      <SocAssistant domain="seo" />
      {assistantOpen && <div className="h-40 md:h-0" aria-hidden />}
    </div>
  );
}
