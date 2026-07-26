"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FUNDAMENTALS,
  LEVEL_NAMES,
  MALWARE,
  RESOURCES,
  RESOURCE_COUNT,
  ROLES,
  SCENARIOS,
  type Level,
} from "@/lib/soc-prep/data";
import {
  FUNDAMENTAL_EXTRAS,
  MALWARE_DEFINITIONS,
  SCENARIO_EXPLAINERS,
} from "@/lib/soc-prep/extras";
import { MCQ_COUNT } from "@/lib/soc-prep/mcq";
import {
  LOG_COUNT,
  LOG_PLATFORMS,
  LOG_SOURCES,
  PLATFORM_NAMES,
  type Platform,
} from "@/lib/soc-prep/logs";
import { SocQuiz } from "./quiz";
import { speech, useActiveTopic } from "./speech";
import { SocAssistant } from "./assistant";
import {
  LEARNING_PATHS,
  PATH_TOTAL_MINUTES,
  type PathRef,
} from "@/lib/soc-prep/path";
import { PROJECTS, PROJECT_CATS, PROJECT_COUNT } from "@/lib/soc-prep/projects";
import { socGuideSlug } from "@/lib/soc-prep/guides";
import {
  EmptyNote,
  FundamentalItem,
  LogSourceCard,
  MalwareItem,
  PathModuleCard,
  ProjectCard,
  ResourceGroupList,
  RoleCard,
  ScenarioItem,
} from "./parts";

/* ------------------------------------------------------------------ */
/* Static derivations (computed once, shared by server + client)       */
/* ------------------------------------------------------------------ */

const strip = (h: string) =>
  h
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .toLowerCase();

const SCENARIO_TEXT = SCENARIOS.map((s) =>
  strip(
    [
      s.title,
      s.category,
      s.situation,
      s.task,
      ...s.actions,
      s.result,
      ...s.lessons,
      ...s.attack,
      SCENARIO_EXPLAINERS[s.id] ?? "",
    ].join(" ")
  )
);
const MALWARE_TEXT = MALWARE.map((m) =>
  strip([m.title, MALWARE_DEFINITIONS[m.id] ?? "", m.body, m.caseStudy].join(" "))
);
const FUNDAMENTAL_TEXT = FUNDAMENTALS.map((q) => {
  const extra = FUNDAMENTAL_EXTRAS[q.question];
  return strip(
    [q.question, q.category, q.answer, extra?.definition ?? "", extra?.realWorld ?? ""].join(" ")
  );
});

const SCENARIO_CATS = [...new Set(SCENARIOS.map((s) => s.category))];
const QA_CATS = [...new Set(FUNDAMENTALS.map((q) => q.category))];

const LOG_TEXT = LOG_SOURCES.map((l) =>
  strip(
    [l.name, PLATFORM_NAMES[l.platform], l.what, l.where, l.sample, l.fields, ...l.lookFor, l.scenario].join(" ")
  )
);

const READ_TOTAL = SCENARIOS.length + MALWARE.length;

const SECTIONS = [
  { id: "path", num: "/01", label: "START HERE" },
  { id: "fundamentals", num: "/02", label: "FUNDAMENTALS" },
  { id: "logs", num: "/03", label: "LOGS" },
  { id: "roles", num: "/04", label: "ROLES" },
  { id: "scenarios", num: "/05", label: "SCENARIOS" },
  { id: "malware", num: "/06", label: "MALWARE" },
  { id: "projects", num: "/07", label: "PROJECTS" },
  { id: "quiz", num: "/08", label: "QUIZ" },
  { id: "resources", num: "/09", label: "RESOURCES" },
] as const;

const PROJECT_TEXT = PROJECTS.map((p) =>
  strip(
    [
      p.title,
      p.category,
      p.tagline,
      p.outcome,
      p.proves,
      ...p.stack,
      ...p.prerequisites,
      ...p.steps.flatMap((s) => [s.title, s.detail]),
      ...p.validation,
      p.pitch,
      ...p.stretch,
    ].join(" ")
  )
);

const L1_PATH = LEARNING_PATHS[0];
const PATH_KEY = "soc-prep:path-done";
const BUILT_KEY = "soc-prep:projects-built";

type SectionId = (typeof SECTIONS)[number]["id"];
type LevelFilter = "all" | Level;
type ReadingSize = "base" | "lg" | "xl";

const READ_KEY = "soc-prep:read";
const SIZE_KEY = "soc-prep:size";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // One-time sync with the class the pre-paint theme script set (same
    // pattern as components/nav.tsx).
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

/** Scroll a just-opened card into a comfortable reading position, keeping it
 *  clear of the sticky control bar (whose height differs on mobile). */
function keepInView(domId: string) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = document.getElementById(domId);
      if (!el) return;
      const bar = document.getElementById("soc-controls");
      const offset = (bar ? bar.getBoundingClientRect().bottom : 100) + 10;
      const top = el.getBoundingClientRect().top;
      if (top < offset || top > window.innerHeight * 0.5) {
        window.scrollTo({ top: top + window.scrollY - offset, behavior: "smooth" });
      }
    })
  );
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

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
      {cats.map((c) => pill(c, `${c.toUpperCase()} ${counts[c]}`))}
    </div>
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
      <span className="mono-label ml-auto text-faint">{count}</span>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The kit                                                             */
/* ------------------------------------------------------------------ */

export function SocPrepKit() {
  const { dark, toggle } = useTheme();
  const assistantOpen = useActiveTopic() !== null;

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [scenarioCat, setScenarioCat] = useState("all");
  const [qaCat, setQaCat] = useState("all");
  const [size, setSize] = useState<ReadingSize>("base");
  const [read, setRead] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  const [openScenario, setOpenScenario] = useState("");
  const [openMalware, setOpenMalware] = useState("");
  const [openQa, setOpenQa] = useState<string[]>([]);
  const [openLog, setOpenLog] = useState("");
  const [logPlatform, setLogPlatform] = useState<"all" | Platform>("all");
  const [openPath, setOpenPath] = useState("");
  const [pathDone, setPathDone] = useState<Set<number>>(new Set());
  const [openProject, setOpenProject] = useState("");
  const [projectCat, setProjectCat] = useState("all");
  const [built, setBuilt] = useState<Set<number>>(new Set());

  const [activeSection, setActiveSection] = useState<SectionId>("path");
  const [showFab, setShowFab] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Stop any read-aloud when leaving the page.
  useEffect(() => () => speech.stop(), []);

  /* --- persistence ------------------------------------------------ */
  // One-time hydration of persisted client-only state; the extra render is
  // intentional (localStorage cannot be read during SSR).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(READ_KEY) ?? "[]");
      if (Array.isArray(r)) setRead(new Set(r.filter((k) => typeof k === "string")));
      const s = localStorage.getItem(SIZE_KEY);
      if (s === "lg" || s === "xl") setSize(s);
      const p = JSON.parse(localStorage.getItem(PATH_KEY) ?? "[]");
      if (Array.isArray(p)) setPathDone(new Set(p.filter((n) => typeof n === "number")));
      const b = JSON.parse(localStorage.getItem(BUILT_KEY) ?? "[]");
      if (Array.isArray(b)) setBuilt(new Set(b.filter((n) => typeof n === "number")));
    } catch {}
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...read]));
      localStorage.setItem(SIZE_KEY, size);
      localStorage.setItem(PATH_KEY, JSON.stringify([...pathDone]));
      localStorage.setItem(BUILT_KEY, JSON.stringify([...built]));
    } catch {}
  }, [read, size, pathDone, built, hydrated]);

  /* --- keyboard: "/" focuses search, Esc clears -------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* --- scroll: progress bar, back-to-top, scrollspy ---------------- */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const h = document.documentElement;
        const pct = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100;
        if (progressRef.current) progressRef.current.style.width = `${pct}%`;
        setShowFab(window.scrollY > 600);
        let current: SectionId = "path";
        for (const s of SECTIONS) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top <= 170) current = s.id;
        }
        setActiveSection(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* --- filtering --------------------------------------------------- */
  const q = query.trim().toLowerCase();

  const visibleScenarios = useMemo(
    () =>
      SCENARIOS.filter(
        (s, i) =>
          (level === "all" || s.level === level) &&
          (scenarioCat === "all" || s.category === scenarioCat) &&
          (!q || SCENARIO_TEXT[i].includes(q))
      ),
    [level, scenarioCat, q]
  );

  const visibleMalware = useMemo(
    () =>
      MALWARE.filter(
        (m, i) => (level === "all" || m.level === level) && (!q || MALWARE_TEXT[i].includes(q))
      ),
    [level, q]
  );

  const visibleQa = useMemo(
    () =>
      FUNDAMENTALS.map((f, i) => ({ f, i })).filter(
        ({ f, i }) =>
          (level === "all" || f.level === level) &&
          (qaCat === "all" || f.category === qaCat) &&
          (!q || FUNDAMENTAL_TEXT[i].includes(q))
      ),
    [level, qaCat, q]
  );

  const visibleLogs = useMemo(
    () =>
      LOG_SOURCES.filter(
        (l, i) =>
          (level === "all" || l.level === level) &&
          (logPlatform === "all" || l.platform === logPlatform) &&
          (!q || LOG_TEXT[i].includes(q))
      ),
    [level, logPlatform, q]
  );

  const logPlatformCounts = useMemo(
    () =>
      Object.fromEntries(
        LOG_PLATFORMS.map((p) => [p, LOG_SOURCES.filter((l) => l.platform === p).length])
      ),
    []
  );

  /** Jump from a path step to the exact card: clear anything that would hide
   *  it, open it, then scroll it into view. */
  const goToRef = (ref: PathRef) => {
    speech.stop();
    setQuery("");
    setLevel("all");
    const target = `${ref.kind}-${ref.id}`;
    if (ref.kind === "qa") {
      setQaCat("all");
      setOpenQa((prev) => (prev.includes(target) ? prev : [...prev, target]));
    } else if (ref.kind === "lg") {
      setLogPlatform("all");
      setOpenLog(target);
    } else if (ref.kind === "sc") {
      setScenarioCat("all");
      setOpenScenario(target);
    } else {
      setOpenMalware(target);
    }
    // Two frames so the filter reset and accordion open have rendered.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(`item-${target}`);
        if (!el) return;
        const bar = document.getElementById("soc-controls");
        const offset = (bar ? bar.getBoundingClientRect().bottom : 100) + 10;
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - offset,
          behavior: "smooth",
        });
      })
    );
  };

  const pathProgress = Math.round((pathDone.size / L1_PATH.modules.length) * 100);

  const visibleProjects = useMemo(
    () =>
      PROJECTS.filter(
        (p, i) =>
          (level === "all" || p.level === level) &&
          (projectCat === "all" || p.category === projectCat) &&
          (!q || PROJECT_TEXT[i].includes(q))
      ),
    [level, projectCat, q]
  );

  const projectCatCounts = useMemo(
    () =>
      Object.fromEntries(
        PROJECT_CATS.map((c) => [c, PROJECTS.filter((p) => p.category === c).length])
      ),
    []
  );

  const visibleRoles = ROLES.filter((r) => level === "all" || r.level === level);

  const scenarioCatCounts = useMemo(
    () =>
      Object.fromEntries(
        SCENARIO_CATS.map((c) => [c, SCENARIOS.filter((s) => s.category === c).length])
      ),
    []
  );
  const qaCatCounts = useMemo(
    () =>
      Object.fromEntries(QA_CATS.map((c) => [c, FUNDAMENTALS.filter((f) => f.category === c).length])),
    []
  );

  const matches = visibleScenarios.length + visibleMalware.length + visibleQa.length;
  const allQaOpen =
    visibleQa.length > 0 && visibleQa.every(({ i }) => openQa.includes(`qa-${i}`));

  /* --- handlers ---------------------------------------------------- */
  const toggleRead = (key: string, closeValue?: "scenario" | "malware") => {
    setRead((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        if (closeValue === "scenario") setOpenScenario("");
        if (closeValue === "malware") setOpenMalware("");
      }
      return next;
    });
  };

  const sizes: { value: ReadingSize; label: string; name: string }[] = [
    { value: "base", label: "A", name: "Default reading size" },
    { value: "lg", label: "A+", name: "Large reading size" },
    { value: "xl", label: "A++", name: "Extra large reading size" },
  ];

  const status = q
    ? `${matches} MATCHES`
    : level === "all"
      ? "ALL TIERS"
      : `${LEVEL_NAMES[level]} ONLY`;

  /* ------------------------------------------------------------------ */

  return (
    <div className="soc-page" data-size={size === "base" ? undefined : size}>
      {/* Reading progress */}
      <div aria-hidden className="soc-noprint fixed inset-x-0 top-0 z-60 h-[3px]">
        <div ref={progressRef} className="h-full w-0 bg-accent" />
      </div>

      <a
        href="#fundamentals"
        className="mono-label sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-70 focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>

      {/* ---------- Top bar ---------- */}
      <div className="soc-noprint z-50 px-4 pt-4 sm:px-5 md:sticky md:top-0 md:bg-paper/85 md:pb-2 md:backdrop-blur-sm">
        <nav
          aria-label="SOC prep sections"
          className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-pill border-[1.5px] border-ink bg-surface px-3 py-2 sm:px-4"
        >
          <Link
            href="/"
            title="Back to portfolio"
            className="flex items-center whitespace-nowrap font-mono text-[13px] font-bold tracking-tight text-ink"
          >
            SOC PREP<span className="text-accent">.</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={activeSection === s.id ? "true" : undefined}
                className={cn(
                  "mono-label rounded-pill px-3 py-1.5 transition-colors",
                  activeSection === s.id
                    ? "bg-ink text-paper"
                    : "text-muted-2 hover:text-ink"
                )}
              >
                {s.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              role="group"
              aria-label="Reading size"
              className="flex items-center overflow-hidden rounded-pill border-[1.5px] border-hairline"
            >
              {sizes.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-label={s.name}
                  aria-pressed={size === s.value}
                  onClick={() => setSize(s.value)}
                  className={cn(
                    "px-2 py-1.5 font-mono text-[10px] transition-colors sm:px-2.5",
                    size === s.value
                      ? "bg-ink font-bold text-paper"
                      : "text-muted-2 hover:text-ink"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
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
        </nav>

        {/* Section links for < lg — horizontally scrollable */}
        <nav
          aria-label="SOC prep sections"
          className="mx-auto mt-2 flex max-w-6xl gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={activeSection === s.id ? "true" : undefined}
              className={cn(
                "mono-label whitespace-nowrap rounded-pill border-[1.5px] px-3 py-1.5 transition-colors",
                activeSection === s.id
                  ? "border-ink bg-ink text-paper"
                  : "border-hairline text-muted-2"
              )}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {/* ---------- Hero ---------- */}
      <header className="px-4 pt-8 sm:px-5 md:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="mono-label flex items-center gap-1 text-muted-2">
            <span>~/soc-prep</span>
            <span className="animate-blink inline-block h-3 w-[7px] bg-accent" aria-hidden />
          </div>
          <p className="mono-label mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-muted-2">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
            DXB · Interview ready
            <span className="text-faint" aria-hidden>
              ✳
            </span>
            L1 · L2 · L3
          </p>
          <h1 className="mt-4 font-display font-bold uppercase leading-[0.94] tracking-[-0.04em] text-[clamp(2.4rem,8vw,4.75rem)]">
            SOC Analyst
            <br />
            <span className="text-stroke-ink">Prep</span>
            <span className="text-accent">*</span>
          </h1>
          <div className="mt-5 font-mono text-[12.5px] leading-[2] text-muted-2">
            <p>
              {"// "}
              <b className="font-medium text-ink">Fundamentals first</b> — the technical
              baseline, then everything else.
            </p>
            <p>
              {"// "}
              <b className="font-medium text-ink">50 scenarios</b> written as STAR answers
              you can say out loud.
            </p>
            <p>{"// Malware analysis, tiered responsibilities, and free resources."}</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border-[1.5px] border-ink bg-hairline sm:grid-cols-3 lg:grid-cols-6">
            {[
              { n: FUNDAMENTALS.length, label: "Fundamentals", href: "#fundamentals" },
              { n: LOG_COUNT, label: "Log sources", href: "#logs" },
              { n: SCENARIOS.length, label: "Scenarios", href: "#scenarios" },
              { n: PROJECT_COUNT, label: "Projects", href: "#projects" },
              { n: MCQ_COUNT, label: "Quiz questions", href: "#quiz" },
              { n: RESOURCE_COUNT, label: "Free resources", href: "#resources" },
            ].map((m) => (
              <a
                key={m.label}
                href={m.href}
                className="bg-surface p-4 transition-colors hover:bg-surface-alt"
              >
                <span className="block font-display text-[26px] font-bold leading-none tracking-[-0.03em]">
                  {m.n}
                </span>
                <span className="mono-label mt-1.5 block text-muted-2">{m.label}</span>
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ---------- Control bar (sticky) ---------- */}
      <div
        id="soc-controls"
        className="soc-noprint sticky top-2 z-40 mt-6 px-4 sm:px-5 md:top-[4.35rem]"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 rounded-lg border-[1.5px] border-ink bg-surface p-2">
          <div className="relative min-w-[190px] flex-1">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-faint"
            >
              /
            </span>
            <label htmlFor="soc-search" className="sr-only">
              Search the prep kit
            </label>
            <Input
              id="soc-search"
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search — kerberoasting, ransomware, DNS tunnelling…"
              autoComplete="off"
              className="h-10 rounded-pill border-[1.5px] border-hairline bg-paper pl-8 pr-9 font-mono text-[13px] placeholder:text-faint focus-visible:border-accent focus-visible:ring-accent/30"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-pill text-muted-2 hover:bg-surface-alt hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>

          <ToggleGroup
            type="single"
            value={level}
            onValueChange={(v) => v && setLevel(v as LevelFilter)}
            spacing={0}
            aria-label="Filter by tier"
            className="overflow-hidden rounded-pill border-[1.5px] border-ink"
          >
            {(["all", "l1", "l2", "l3"] as const).map((lv) => (
              <ToggleGroupItem
                key={lv}
                value={lv}
                size="sm"
                className={cn(
                  "mono-label h-9 rounded-none border-0 px-3 text-muted-2 hover:text-ink sm:px-3.5",
                  lv === "all" && "data-[state=on]:bg-ink data-[state=on]:text-paper",
                  lv === "l1" && "data-[state=on]:bg-(--soc-l1) data-[state=on]:text-paper",
                  lv === "l2" && "data-[state=on]:bg-(--soc-l2) data-[state=on]:text-paper",
                  lv === "l3" && "data-[state=on]:bg-(--soc-l3) data-[state=on]:text-paper"
                )}
              >
                {lv === "all" ? "ALL" : LEVEL_NAMES[lv]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <p role="status" className="mono-label hidden pr-1 text-faint md:block">
            {status}
            {read.size > 0 && (
              <span className="ml-3 text-accent-strong">
                ✓ {read.size} OF {READ_TOTAL} READ
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ---------- Content ---------- */}
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-5">
        {/* /01 LEARNING PATH */}
        <section id="path" className="scroll-mt-28 pt-12 md:scroll-mt-40">
          <SectionHeader
            num="/01"
            title="Start Here"
            count={`${pathDone.size} / ${L1_PATH.modules.length} complete`}
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// The rest of this page is a reference library. This is the order to actually learn it in."}
          </p>

          <div className="mb-5 rounded-lg border-[1.5px] border-ink bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="font-display text-lg font-semibold">{L1_PATH.title}</h3>
              <span className="mono-label text-muted-2">
                {L1_PATH.modules.length} modules · ~{Math.round(PATH_TOTAL_MINUTES / 60)} hours
              </span>
            </div>
            <p className="soc-prose mt-2 max-w-(--soc-measure)">{L1_PATH.intro}</p>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="mono-label text-muted-2">Your progress</span>
                <span className="mono-label text-accent-strong">{pathProgress}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-surface-alt">
                <div
                  className="h-full rounded-pill bg-accent transition-[width] duration-300"
                  style={{ width: `${pathProgress}%` }}
                />
              </div>
            </div>

            {pathDone.size > 0 && (
              <button
                type="button"
                onClick={() => setPathDone(new Set())}
                className="mono-label soc-noprint mt-3 text-faint transition-colors hover:text-ink"
              >
                reset progress
              </button>
            )}
          </div>

          <Accordion
            type="single"
            collapsible
            value={openPath}
            onValueChange={(v) => {
              speech.stop();
              setOpenPath(v);
              if (v) keepInView(`item-${v}`);
            }}
          >
            {L1_PATH.modules.map((m) => (
              <PathModuleCard
                key={m.id}
                module={m}
                done={pathDone.has(m.id)}
                onToggleDone={() =>
                  setPathDone((prev) => {
                    const next = new Set(prev);
                    if (next.has(m.id)) next.delete(m.id);
                    else next.add(m.id);
                    return next;
                  })
                }
                onGoTo={goToRef}
              />
            ))}
          </Accordion>
        </section>

        {/* /02 FUNDAMENTALS */}
        <section id="fundamentals" className="scroll-mt-28 pt-12 md:scroll-mt-40">
          <SectionHeader
            num="/02"
            title="Fundamentals"
            count={`${visibleQa.length} / ${FUNDAMENTALS.length} shown`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setOpenQa(allQaOpen ? [] : visibleQa.map(({ i }) => `qa-${i}`))
                }
                className="soc-noprint mono-label rounded-pill border-[1.5px]"
              >
                {allQaOpen ? "COLLAPSE ALL" : "EXPAND ALL"}
              </Button>
            }
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Start here. The technical baseline — if you cannot answer these, the scenarios will not save you."}
          </p>
          <CategoryPills
            cats={QA_CATS}
            counts={qaCatCounts}
            total={FUNDAMENTALS.length}
            active={qaCat}
            onChange={setQaCat}
            label="Filter fundamentals by topic"
          />
          <Accordion
            type="multiple"
            value={openQa}
            onValueChange={(v) => {
              const added = v.find((x) => !openQa.includes(x));
              setOpenQa(v);
              if (added) keepInView(`item-${added}`);
            }}
          >
            {visibleQa.map(({ f, i }) => (
              <FundamentalItem key={i} fundamental={f} index={i} />
            ))}
          </Accordion>
          {visibleQa.length === 0 && (
            <EmptyNote>No questions match. Clear the search or pick another topic.</EmptyNote>
          )}
        </section>

        {/* /03 LOGS */}
        <section id="logs" className="scroll-mt-28 pt-14 md:scroll-mt-40">
          <SectionHeader
            num="/03"
            title="Log Analysis"
            count={`${visibleLogs.length} / ${LOG_SOURCES.length} shown`}
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Every log an analyst reads — what it records, where it lives, a real sample, the fields that matter, what to look for, and a case where it was the answer."}
          </p>

          <div
            role="group"
            aria-label="Filter logs by platform"
            className="soc-noprint mb-5 flex flex-wrap gap-1.5"
          >
            {(["all", ...LOG_PLATFORMS] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={logPlatform === p}
                onClick={() => setLogPlatform(p)}
                className={cn(
                  "mono-label rounded-pill border-[1.5px] px-3 py-1.5 transition-colors",
                  logPlatform === p
                    ? "border-ink bg-ink text-paper"
                    : "border-hairline text-muted-2 hover:border-ink hover:text-ink"
                )}
              >
                {p === "all"
                  ? `ALL ${LOG_SOURCES.length}`
                  : `${PLATFORM_NAMES[p].toUpperCase()} ${logPlatformCounts[p]}`}
              </button>
            ))}
          </div>

          <Accordion
            type="single"
            collapsible
            value={openLog}
            onValueChange={(v) => {
              speech.stop();
              setOpenLog(v);
              if (v) keepInView(`item-${v}`);
            }}
          >
            {visibleLogs.map((l) => (
              <LogSourceCard key={l.id} source={l} />
            ))}
          </Accordion>
          {visibleLogs.length === 0 && (
            <EmptyNote>No log sources match. Clear the search or pick another platform.</EmptyNote>
          )}
        </section>

        {/* /04 RESPONSIBILITIES */}
        <section id="roles" className="scroll-mt-28 pt-14 md:scroll-mt-40">
          <SectionHeader num="/04" title="Responsibilities" count="What you own at each tier" />
          <p className="mt-3 mb-6 font-mono text-[11.5px] text-muted-2">
            {"// Know your own job description before the interview. Answer with what you own, not what the tool does."}
          </p>
          <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(290px,1fr))]">
            {visibleRoles.map((r) => (
              <RoleCard key={r.level} role={r} />
            ))}
          </div>
        </section>

        {/* /05 SCENARIOS */}
        <section id="scenarios" className="scroll-mt-28 pt-14 md:scroll-mt-40">
          <SectionHeader
            num="/05"
            title="50 Scenarios"
            count={`${visibleScenarios.length} / ${SCENARIOS.length} shown`}
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Each one is Situation → Task → Action → Result → Lessons. Expand, read it once, say it in your own words."}
          </p>
          <CategoryPills
            cats={SCENARIO_CATS}
            counts={scenarioCatCounts}
            total={SCENARIOS.length}
            active={scenarioCat}
            onChange={setScenarioCat}
            label="Filter scenarios by category"
          />
          <Accordion
            type="single"
            collapsible
            value={openScenario}
            onValueChange={(v) => {
              speech.stop();
              setOpenScenario(v);
              if (v) keepInView(`item-${v}`);
            }}
          >
            {visibleScenarios.map((s) => (
              <ScenarioItem
                key={s.id}
                scenario={s}
                open={openScenario === `sc-${s.id}`}
                read={read.has(`sc${s.id}`)}
                onToggleRead={() => toggleRead(`sc${s.id}`, "scenario")}
              />
            ))}
          </Accordion>
          {visibleScenarios.length === 0 && (
            <EmptyNote>No scenarios match. Clear the search or pick another filter.</EmptyNote>
          )}
        </section>

        {/* /06 MALWARE */}
        <section id="malware" className="scroll-mt-28 pt-14 md:scroll-mt-40">
          <SectionHeader
            num="/06"
            title="Malware Analysis"
            count={`${visibleMalware.length} / ${MALWARE.length} shown`}
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Concepts plus the exact wording to use. Every topic ends with a “say this” line and a real case to attach it to."}
          </p>
          <Accordion
            type="single"
            collapsible
            value={openMalware}
            onValueChange={(v) => {
              speech.stop();
              setOpenMalware(v);
              if (v) keepInView(`item-${v}`);
            }}
          >
            {visibleMalware.map((m) => (
              <MalwareItem
                key={m.id}
                topic={m}
                read={read.has(`ma${m.id}`)}
                onToggleRead={() => toggleRead(`ma${m.id}`, "malware")}
              />
            ))}
          </Accordion>
          {visibleMalware.length === 0 && <EmptyNote>No topics match your filter.</EmptyNote>}
        </section>

        {/* /07 PROJECTS */}
        <section id="projects" className="scroll-mt-28 pt-14 md:scroll-mt-40">
          <SectionHeader
            num="/07"
            title="Projects"
            count={`${visibleProjects.length} / ${PROJECTS.length} shown`}
            action={
              built.size > 0 ? (
                <span className="mono-label text-accent-strong">
                  ✓ {built.size} BUILT
                </span>
              ) : undefined
            }
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Build these. Reading gets you through the screening call; having built something gets you the job. Every project is free and runs at home."}
          </p>
          <CategoryPills
            cats={PROJECT_CATS}
            counts={projectCatCounts}
            total={PROJECTS.length}
            active={projectCat}
            onChange={setProjectCat}
            label="Filter projects by category"
          />
          <Accordion
            type="single"
            collapsible
            value={openProject}
            onValueChange={(v) => {
              speech.stop();
              setOpenProject(v);
              if (v) keepInView(`item-${v}`);
            }}
          >
            {visibleProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                guideSlug={socGuideSlug(p.id)}
                built={built.has(p.id)}
                onToggleBuilt={() =>
                  setBuilt((prev) => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id);
                    else next.add(p.id);
                    return next;
                  })
                }
              />
            ))}
          </Accordion>
          {visibleProjects.length === 0 && (
            <EmptyNote>No projects match. Clear the search or pick another filter.</EmptyNote>
          )}
        </section>

        {/* /08 PRACTICE QUIZ */}
        <section id="quiz" className="scroll-mt-28 pt-14 md:scroll-mt-40">
          <SectionHeader
            num="/08"
            title="Practice Quiz"
            count={`${MCQ_COUNT} questions`}
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Test yourself. Immediate feedback and the reasoning on every answer — respects the tier filter above."}
          </p>
          <SocQuiz level={level} />
        </section>

        {/* /09 RESOURCES */}
        <section id="resources" className="scroll-mt-28 pt-14 md:scroll-mt-40">
          <SectionHeader num="/09" title="Free Resources" count="All free or free-tier" />
          <p className="mt-3 mb-6 font-mono text-[11.5px] text-muted-2">
            {"// YouTube channels, hands-on labs, malware sandboxes, and reference sites. Every link is free to use."}
          </p>
          {RESOURCES.map((g) => (
            <ResourceGroupList key={g.group} group={g} />
          ))}
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-hairline px-4 py-8 text-center sm:px-5">
        <p className="mono-label text-faint">
          © Faisal Khan <span aria-hidden>●</span> SOC prep kit <span aria-hidden>●</span>{" "}
          Built for the interview
        </p>
        <Link
          href="/"
          className="mono-label mt-3 inline-block text-accent-strong hover:underline"
        >
          ← Back to portfolio
        </Link>
      </footer>

      {/* ---------- Voice assistant dock (appears when a Listen is active) ---------- */}
      <SocAssistant />

      {/* ---------- Back to top (hidden while the assistant dock is open) ---------- */}
      <Button
        size="icon"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "soc-noprint fixed bottom-5 right-4 z-40 rounded-pill bg-accent font-mono font-bold text-paper transition-opacity hover:bg-accent/90 sm:right-6",
          showFab && !assistantOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        ↑
      </Button>
    </div>
  );
}
