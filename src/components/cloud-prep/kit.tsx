"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ATTACK_PATHS,
  CERT_NAMES,
  FUNDAMENTALS,
  PLAYBOOKS,
  PROVIDER_NAMES,
  RESOURCES,
  RESOURCE_COUNT,
  ROLES,
  SCENARIOS,
  TACTICS,
  TIER_NAMES,
  type Cert,
  type Provider,
  type Tier,
} from "@/lib/cloud-prep/data";
import { CLOUD_MCQ_COUNT } from "@/lib/cloud-prep/mcq";
import { speech, useActiveTopic } from "@/components/soc-prep/speech";
import { SocAssistant } from "@/components/soc-prep/assistant";
import { ResourceGroupList } from "@/components/soc-prep/parts";
import {
  CLOUD_LEARNING_PATHS,
  CLOUD_PATH_TOTAL_MINUTES,
  type CloudPathRef,
} from "@/lib/cloud-prep/path";
import { cloudGuideSlug } from "@/lib/cloud-prep/guides";
import {
  CLOUD_PROJECTS,
  CLOUD_PROJECT_CATS,
  CLOUD_PROJECT_COUNT,
} from "@/lib/cloud-prep/projects";
import {
  AttackPathCard,
  CloudPathModuleCard,
  CloudProjectCard,
  EmptyNote,
  FundamentalCard,
  PlaybookCard,
  RoleCard,
  ScenarioCard,
  TacticCard,
} from "./parts";
import { CloudQuiz } from "./quiz";

const strip = (h: string) =>
  h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").toLowerCase();

const FUNDAMENTAL_TEXT = FUNDAMENTALS.map((f) =>
  strip([f.title, f.category, f.concept, ...Object.values(f.providers)].join(" "))
);
const FUNDAMENTAL_CATS = [...new Set(FUNDAMENTALS.map((f) => f.category))];

const SCENARIO_TEXT = SCENARIOS.map((s) =>
  strip(
    [
      s.title,
      s.category,
      s.plain,
      s.situation,
      s.task,
      ...s.actions,
      s.result,
      ...s.lessons,
      ...s.attack,
    ].join(" ")
  )
);
const SCENARIO_CATS = [...new Set(SCENARIOS.map((s) => s.category))];

const ATTACK_TEXT = ATTACK_PATHS.map((a) =>
  strip(
    [a.title, a.category, a.how, a.enabler, a.detect, a.fix, ...Object.values(a.providers), ...a.attack].join(" ")
  )
);
const TACTIC_TEXT = TACTICS.map((t) =>
  strip(
    [t.id, t.name, t.goal, ...t.techniques.flatMap((k) => [k.id, k.name, k.cloud, k.detect])].join(" ")
  )
);
const PLAYBOOK_TEXT = PLAYBOOKS.map((p) =>
  strip([p.domain, p.goal, ...p.checklist, ...Object.values(p.providers)].join(" "))
);

const DEEP_TABS = [
  { id: "attacks", label: "ATTACKS & MISCONFIGS" },
  { id: "attack-matrix", label: "ATT&CK FOR CLOUD" },
  { id: "playbooks", label: "HARDENING PLAYBOOKS" },
] as const;
type DeepTab = (typeof DEEP_TABS)[number]["id"];

const SECTIONS = [
  { id: "path", num: "/01", label: "START HERE" },
  { id: "fundamentals", num: "/02", label: "FUNDAMENTALS" },
  { id: "roles", num: "/03", label: "ROLES" },
  { id: "scenarios", num: "/04", label: "SCENARIOS" },
  { id: "deepdives", num: "/05", label: "DEEP DIVES" },
  { id: "projects", num: "/06", label: "PROJECTS" },
  { id: "quiz", num: "/07", label: "QUIZ" },
  { id: "resources", num: "/08", label: "RESOURCES" },
] as const;

const PROJECT_TEXT = CLOUD_PROJECTS.map((p) =>
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

const ASSOCIATE_PATH = CLOUD_LEARNING_PATHS[0];
const CLOUD_PATH_KEY = "cloud-prep:path-done";
const CLOUD_BUILT_KEY = "cloud-prep:projects-built";
type SectionId = (typeof SECTIONS)[number]["id"];

type TierFilter = "all" | Tier;
type ProviderFilter = "all" | Provider;
type CertFilter = "all" | Cert;
type ReadingSize = "base" | "lg" | "xl";

const SIZE_KEY = "cloud-prep:size";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
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

function keepInView(domId: string) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = document.getElementById(domId);
      if (!el) return;
      const bar = document.getElementById("cloud-controls");
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
      <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-accent-strong">{num}</span>
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
}: {
  cats: string[];
  counts: Record<string, number>;
  total: number;
  active: string;
  onChange: (c: string) => void;
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
    <div className="soc-noprint mb-5 flex flex-wrap gap-1.5">
      {pill("all", `ALL ${total}`)}
      {cats.map((c) => pill(c, `${c.toUpperCase()} ${counts[c]}`))}
    </div>
  );
}

export function CloudPrepKit() {
  const { dark, toggle } = useTheme();
  const assistantOpen = useActiveTopic() !== null;

  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [provider, setProvider] = useState<ProviderFilter>("all");
  const [cert, setCert] = useState<CertFilter>("all");
  const [cat, setCat] = useState("all");
  const [size, setSize] = useState<ReadingSize>("base");
  const [hydrated, setHydrated] = useState(false);

  const [openFund, setOpenFund] = useState<string[]>([]);
  const [openScenario, setOpenScenario] = useState("");
  const [scenarioCat, setScenarioCat] = useState("all");
  const [deepTab, setDeepTab] = useState<DeepTab>("attacks");
  const [openDeep, setOpenDeep] = useState("");
  const [openPath, setOpenPath] = useState("");
  const [pathDone, setPathDone] = useState<Set<number>>(new Set());
  const [openProject, setOpenProject] = useState("");
  const [projectCat, setProjectCat] = useState("all");
  const [built, setBuilt] = useState<Set<number>>(new Set());
  const [activeSection, setActiveSection] = useState<SectionId>("path");
  const [showFab, setShowFab] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => speech.stop(), []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const s = localStorage.getItem(SIZE_KEY);
      if (s === "lg" || s === "xl") setSize(s);
      const p = JSON.parse(localStorage.getItem(CLOUD_PATH_KEY) ?? "[]");
      if (Array.isArray(p)) setPathDone(new Set(p.filter((n) => typeof n === "number")));
      const b = JSON.parse(localStorage.getItem(CLOUD_BUILT_KEY) ?? "[]");
      if (Array.isArray(b)) setBuilt(new Set(b.filter((n) => typeof n === "number")));
    } catch {}
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SIZE_KEY, size);
      localStorage.setItem(CLOUD_PATH_KEY, JSON.stringify([...pathDone]));
      localStorage.setItem(CLOUD_BUILT_KEY, JSON.stringify([...built]));
    } catch {}
  }, [size, pathDone, built, hydrated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
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

  const q = query.trim().toLowerCase();

  const visibleFundamentals = useMemo(
    () =>
      FUNDAMENTALS.map((f, i) => ({ f, i })).filter(
        ({ f, i }) =>
          (tier === "all" || f.tier === tier) &&
          (cat === "all" || f.category === cat) &&
          (cert === "all" || f.certs.includes(cert)) &&
          (provider === "all" || !!f.providers[provider]) &&
          (!q || FUNDAMENTAL_TEXT[i].includes(q))
      ),
    [tier, cat, cert, provider, q]
  );

  const catCounts = useMemo(
    () =>
      Object.fromEntries(
        FUNDAMENTAL_CATS.map((c) => [c, FUNDAMENTALS.filter((f) => f.category === c).length])
      ),
    []
  );

  const visibleScenarios = useMemo(
    () =>
      SCENARIOS.filter(
        (s, i) =>
          (tier === "all" || s.tier === tier) &&
          (provider === "all" || s.provider === provider) &&
          (cert === "all" || s.certs.includes(cert)) &&
          (scenarioCat === "all" || s.category === scenarioCat) &&
          (!q || SCENARIO_TEXT[i].includes(q))
      ),
    [tier, provider, cert, scenarioCat, q]
  );

  const scenarioCatCounts = useMemo(
    () =>
      Object.fromEntries(
        SCENARIO_CATS.map((c) => [c, SCENARIOS.filter((s) => s.category === c).length])
      ),
    []
  );

  const visibleAttacks = useMemo(
    () =>
      ATTACK_PATHS.filter(
        (a, i) =>
          (tier === "all" || a.tier === tier) &&
          (cert === "all" || a.certs.includes(cert)) &&
          (provider === "all" || !!a.providers[provider]) &&
          (!q || ATTACK_TEXT[i].includes(q))
      ),
    [tier, cert, provider, q]
  );

  const visibleTactics = useMemo(
    () => TACTICS.filter((_, i) => !q || TACTIC_TEXT[i].includes(q)),
    [q]
  );

  const visiblePlaybooks = useMemo(
    () =>
      PLAYBOOKS.filter(
        (p, i) =>
          (tier === "all" || p.tier === tier) &&
          (cert === "all" || p.certs.includes(cert)) &&
          (provider === "all" || !!p.providers[provider]) &&
          (!q || PLAYBOOK_TEXT[i].includes(q))
      ),
    [tier, cert, provider, q]
  );

  /** Jump from a path step to the full card: clear anything that would hide it,
   *  open it, then scroll it into view. */
  const goToRef = (ref: CloudPathRef) => {
    speech.stop();
    setQuery("");
    setTier("all");
    setCert("all");
    const target = `${ref.kind}-${ref.id}`;
    if (ref.kind === "cf") {
      setCat("all");
      setOpenFund((prev) => (prev.includes(target) ? prev : [...prev, target]));
    } else if (ref.kind === "cs") {
      setScenarioCat("all");
      setOpenScenario(target);
    } else {
      setDeepTab(ref.kind === "ap" ? "attacks" : ref.kind === "pb" ? "playbooks" : "attack-matrix");
      setOpenDeep(target);
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(`item-${target}`);
        if (!el) return;
        const bar = document.getElementById("cloud-controls");
        const offset = (bar ? bar.getBoundingClientRect().bottom : 100) + 10;
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - offset,
          behavior: "smooth",
        });
      })
    );
  };

  const pathProgress = Math.round((pathDone.size / ASSOCIATE_PATH.modules.length) * 100);

  const visibleProjects = useMemo(
    () =>
      CLOUD_PROJECTS.filter(
        (p, i) =>
          (tier === "all" || p.tier === tier) &&
          (provider === "all" || p.providers.includes(provider)) &&
          (projectCat === "all" || p.category === projectCat) &&
          (!q || PROJECT_TEXT[i].includes(q))
      ),
    [tier, provider, projectCat, q]
  );

  const projectCatCounts = useMemo(
    () =>
      Object.fromEntries(
        CLOUD_PROJECT_CATS.map((c) => [
          c,
          CLOUD_PROJECTS.filter((p) => p.category === c).length,
        ])
      ),
    []
  );

  const deepCount =
    deepTab === "attacks"
      ? `${visibleAttacks.length} / ${ATTACK_PATHS.length} shown`
      : deepTab === "attack-matrix"
        ? `${visibleTactics.length} / ${TACTICS.length} tactics`
        : `${visiblePlaybooks.length} / ${PLAYBOOKS.length} playbooks`;

  const visibleRoles = ROLES.filter((r) => tier === "all" || r.tier === tier);
  const allFundOpen =
    visibleFundamentals.length > 0 &&
    visibleFundamentals.every(({ i }) => openFund.includes(`cf-${i}`));

  const sizes: { value: ReadingSize; label: string; name: string }[] = [
    { value: "base", label: "A", name: "Default reading size" },
    { value: "lg", label: "A+", name: "Large reading size" },
    { value: "xl", label: "A++", name: "Extra large reading size" },
  ];

  const providerFilter: ProviderFilter = provider;

  return (
    <div className="soc-page" data-size={size === "base" ? undefined : size}>
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
          aria-label="Cloud security prep sections"
          className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-pill border-[1.5px] border-ink bg-surface px-3 py-2 sm:px-4"
        >
          <Link
            href="/"
            title="Back to portfolio"
            className="flex items-center whitespace-nowrap font-mono text-[13px] font-bold tracking-tight text-ink"
          >
            CLOUD SEC<span className="text-accent">.</span>
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={activeSection === s.id ? "true" : undefined}
                className={cn(
                  "mono-label rounded-pill px-3 py-1.5 transition-colors",
                  activeSection === s.id ? "bg-ink text-paper" : "text-muted-2 hover:text-ink"
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
                    size === s.value ? "bg-ink font-bold text-paper" : "text-muted-2 hover:text-ink"
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

        <nav
          aria-label="Cloud security prep sections"
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
            <span>~/cloud-security-prep</span>
            <span className="animate-blink inline-block h-3 w-[7px] bg-accent" aria-hidden />
          </div>
          <p className="mono-label mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-muted-2">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
            AWS · Azure · GCP
            <span className="text-faint" aria-hidden>✳</span>
            Associate · Engineer · Architect
          </p>
          <h1 className="mt-4 font-display font-bold uppercase leading-[0.94] tracking-[-0.04em] text-[clamp(2.2rem,7.5vw,4.5rem)]">
            Cloud Security
            <br />
            <span className="text-stroke-ink">Prep</span>
            <span className="text-accent">*</span>
          </h1>
          <div className="mt-5 font-mono text-[12.5px] leading-[2] text-muted-2">
            <p>{"// "}<b className="font-medium text-ink">Multi-cloud</b> — every topic mapped across AWS, Azure, and GCP.</p>
            <p>{"// "}<b className="font-medium text-ink">All seniority levels</b> — Associate, Engineer, and Architect.</p>
            <p>{"// Interview-ready and aligned to AWS SCS, AZ-500, GCP PCSE, and CCSP."}</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border-[1.5px] border-ink bg-hairline sm:grid-cols-3 lg:grid-cols-6">
            {[
              { n: FUNDAMENTALS.length, label: "Fundamentals", href: "#fundamentals" },
              { n: SCENARIOS.length, label: "Scenarios", href: "#scenarios" },
              { n: ATTACK_PATHS.length, label: "Attack paths", href: "#deepdives" },
              { n: CLOUD_PROJECT_COUNT, label: "Projects", href: "#projects" },
              { n: CLOUD_MCQ_COUNT, label: "Quiz questions", href: "#quiz" },
              { n: RESOURCE_COUNT, label: "Free resources", href: "#resources" },
            ].map((m) => (
              <a key={m.label} href={m.href} className="bg-surface p-4 transition-colors hover:bg-surface-alt">
                <span className="block font-display text-[26px] font-bold leading-none tracking-[-0.03em]">{m.n}</span>
                <span className="mono-label mt-1.5 block text-muted-2">{m.label}</span>
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ---------- Control bar ---------- */}
      <div
        id="cloud-controls"
        className="soc-noprint sticky top-2 z-40 mt-6 px-4 sm:px-5 md:top-[4.35rem]"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 rounded-lg border-[1.5px] border-ink bg-surface p-2">
          <div className="relative min-w-[180px] flex-1">
            <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-faint">/</span>
            <label htmlFor="cloud-search" className="sr-only">Search the kit</label>
            <Input
              id="cloud-search"
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search — IAM, KMS, SSRF, CSPM, guardrails…"
              autoComplete="off"
              className="h-10 rounded-pill border-[1.5px] border-hairline bg-paper pl-8 pr-3 font-mono text-[13px] placeholder:text-faint focus-visible:border-accent focus-visible:ring-accent/30"
            />
          </div>

          {/* Tier */}
          <ToggleGroup
            type="single"
            value={tier}
            onValueChange={(v) => v && setTier(v as TierFilter)}
            spacing={0}
            aria-label="Filter by seniority"
            className="overflow-hidden rounded-pill border-[1.5px] border-ink"
          >
            {(["all", "associate", "engineer", "architect"] as const).map((t) => (
              <ToggleGroupItem
                key={t}
                value={t}
                size="sm"
                className={cn(
                  "mono-label h-9 rounded-none border-0 px-2.5 text-muted-2 hover:text-ink",
                  t === "all" && "data-[state=on]:bg-ink data-[state=on]:text-paper",
                  t === "associate" && "data-[state=on]:bg-(--cloud-associate) data-[state=on]:text-paper",
                  t === "engineer" && "data-[state=on]:bg-(--cloud-engineer) data-[state=on]:text-paper",
                  t === "architect" && "data-[state=on]:bg-(--cloud-architect) data-[state=on]:text-paper"
                )}
              >
                {t === "all" ? "ALL" : TIER_NAMES[t].slice(0, 4).toUpperCase()}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Provider */}
          <ToggleGroup
            type="single"
            value={provider}
            onValueChange={(v) => v && setProvider(v as ProviderFilter)}
            spacing={0}
            aria-label="Filter by cloud provider"
            className="overflow-hidden rounded-pill border-[1.5px] border-ink"
          >
            {(["all", "aws", "azure", "gcp"] as const).map((p) => (
              <ToggleGroupItem
                key={p}
                value={p}
                size="sm"
                className={cn(
                  "mono-label h-9 rounded-none border-0 px-2.5 text-muted-2 hover:text-ink",
                  p === "all" && "data-[state=on]:bg-ink data-[state=on]:text-paper",
                  p === "aws" && "data-[state=on]:bg-(--cloud-aws) data-[state=on]:text-paper",
                  p === "azure" && "data-[state=on]:bg-(--cloud-azure) data-[state=on]:text-paper",
                  p === "gcp" && "data-[state=on]:bg-(--cloud-gcp) data-[state=on]:text-paper"
                )}
              >
                {p === "all" ? "ALL" : PROVIDER_NAMES[p]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Cert */}
          <label className="flex items-center gap-1.5">
            <span className="mono-label text-faint">Cert</span>
            <select
              value={cert}
              onChange={(e) => setCert(e.target.value as CertFilter)}
              aria-label="Filter by certification"
              className="h-9 rounded-pill border-[1.5px] border-hairline bg-paper px-2.5 font-mono text-[11px] text-ink outline-none focus:border-accent"
            >
              <option value="all">All certs</option>
              {(Object.keys(CERT_NAMES) as Cert[]).map((c) => (
                <option key={c} value={c}>{CERT_NAMES[c]}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ---------- Content ---------- */}
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-5">
        {/* /01 LEARNING PATH */}
        <section id="path" className="scroll-mt-28 pt-12 md:scroll-mt-44">
          <SectionHeader
            num="/01"
            title="Start Here"
            count={`${pathDone.size} / ${ASSOCIATE_PATH.modules.length} complete`}
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// The rest of this page is a reference library. This is the order to actually learn it in."}
          </p>

          <div className="mb-5 rounded-lg border-[1.5px] border-ink bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="font-display text-lg font-semibold">{ASSOCIATE_PATH.title}</h3>
              <span className="mono-label text-muted-2">
                {ASSOCIATE_PATH.modules.length} modules · ~
                {Math.round(CLOUD_PATH_TOTAL_MINUTES / 60)} hours
              </span>
            </div>
            <p className="soc-prose mt-2 max-w-(--soc-measure)">{ASSOCIATE_PATH.intro}</p>

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
            {ASSOCIATE_PATH.modules.map((m) => (
              <CloudPathModuleCard
                key={m.id}
                module={m}
                done={pathDone.has(m.id)}
                providerFilter={provider}
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
        <section id="fundamentals" className="scroll-mt-28 pt-12 md:scroll-mt-44">
          <SectionHeader
            num="/02"
            title="Fundamentals"
            count={`${visibleFundamentals.length} / ${FUNDAMENTALS.length} shown`}
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Core cloud security, each with the concept + how it maps to AWS, Azure, and GCP. Use the provider toggle to focus one cloud."}
          </p>
          <div className="soc-noprint mb-5 flex flex-wrap items-center justify-between gap-3">
            <CategoryPills
              cats={FUNDAMENTAL_CATS}
              counts={catCounts}
              total={FUNDAMENTALS.length}
              active={cat}
              onChange={setCat}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setOpenFund(allFundOpen ? [] : visibleFundamentals.map(({ i }) => `cf-${i}`))
              }
              className="mono-label rounded-pill border-[1.5px]"
            >
              {allFundOpen ? "COLLAPSE ALL" : "EXPAND ALL"}
            </Button>
          </div>
          <Accordion
            type="multiple"
            value={openFund}
            onValueChange={(v) => {
              const added = v.find((x) => !openFund.includes(x));
              setOpenFund(v);
              if (added) keepInView(`item-${added}`);
            }}
          >
            {visibleFundamentals.map(({ f, i }) => (
              <FundamentalCard key={i} fundamental={f} index={i} providerFilter={providerFilter} />
            ))}
          </Accordion>
          {visibleFundamentals.length === 0 && (
            <EmptyNote>No topics match. Clear the search or widen the filters.</EmptyNote>
          )}
        </section>

        {/* /03 RESPONSIBILITIES */}
        <section id="roles" className="scroll-mt-28 pt-14 md:scroll-mt-44">
          <SectionHeader num="/03" title="Responsibilities" count="What you own at each level" />
          <p className="mt-3 mb-6 font-mono text-[11.5px] text-muted-2">
            {"// Know your job description before the interview — answer with what you own at your level."}
          </p>
          <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(290px,1fr))]">
            {visibleRoles.map((r) => (
              <RoleCard key={r.tier} role={r} />
            ))}
          </div>
        </section>

        {/* /04 SCENARIOS */}
        <section id="scenarios" className="scroll-mt-28 pt-14 md:scroll-mt-44">
          <SectionHeader
            num="/04"
            title="Scenarios"
            count={`${visibleScenarios.length} / ${SCENARIOS.length} shown`}
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Real cloud incidents as Situation → Task → Action → Result → Lessons. Each starts with a plain-English summary."}
          </p>
          <CategoryPills
            cats={SCENARIO_CATS}
            counts={scenarioCatCounts}
            total={SCENARIOS.length}
            active={scenarioCat}
            onChange={setScenarioCat}
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
              <ScenarioCard key={s.id} scenario={s} open={openScenario === `cs-${s.id}`} />
            ))}
          </Accordion>
          {visibleScenarios.length === 0 && (
            <EmptyNote>No scenarios match. Clear the search or widen the filters.</EmptyNote>
          )}
        </section>

        {/* /05 DEEP DIVES */}
        <section id="deepdives" className="scroll-mt-28 pt-14 md:scroll-mt-44">
          <SectionHeader num="/05" title="Deep Dives" count={deepCount} />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// How attacks actually work, the ATT&CK cloud matrix, and the checklists that harden each domain."}
          </p>

          <div
            role="tablist"
            aria-label="Deep dive topics"
            className="soc-noprint mb-5 flex flex-wrap gap-1.5"
          >
            {DEEP_TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={deepTab === t.id}
                onClick={() => {
                  speech.stop();
                  setDeepTab(t.id);
                  setOpenDeep("");
                }}
                className={cn(
                  "mono-label rounded-pill border-[1.5px] px-3.5 py-2 transition-colors",
                  deepTab === t.id
                    ? "border-ink bg-ink text-paper"
                    : "border-hairline text-muted-2 hover:border-ink hover:text-ink"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Accordion
            type="single"
            collapsible
            value={openDeep}
            onValueChange={(v) => {
              speech.stop();
              setOpenDeep(v);
              if (v) keepInView(`item-${v}`);
            }}
          >
            {deepTab === "attacks" &&
              visibleAttacks.map((a) => (
                <AttackPathCard key={a.id} path={a} providerFilter={providerFilter} />
              ))}
            {deepTab === "attack-matrix" &&
              visibleTactics.map((t) => <TacticCard key={t.id} tactic={t} />)}
            {deepTab === "playbooks" &&
              visiblePlaybooks.map((p) => (
                <PlaybookCard key={p.id} playbook={p} providerFilter={providerFilter} />
              ))}
          </Accordion>

          {((deepTab === "attacks" && visibleAttacks.length === 0) ||
            (deepTab === "attack-matrix" && visibleTactics.length === 0) ||
            (deepTab === "playbooks" && visiblePlaybooks.length === 0)) && (
            <EmptyNote>Nothing matches. Clear the search or widen the filters.</EmptyNote>
          )}
        </section>

        {/* /06 PROJECTS */}
        <section id="projects" className="scroll-mt-28 pt-14 md:scroll-mt-44">
          <SectionHeader
            num="/06"
            title="Projects"
            count={`${visibleProjects.length} / ${CLOUD_PROJECTS.length} shown`}
            action={
              built.size > 0 ? (
                <span className="mono-label text-accent-strong">✓ {built.size} BUILT</span>
              ) : undefined
            }
          />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Build these. Nobody hires a cloud security engineer who has only read about IAM. Every project uses free tier where it can — set a budget alert before you start."}
          </p>
          <CategoryPills
            cats={CLOUD_PROJECT_CATS}
            counts={projectCatCounts}
            total={CLOUD_PROJECTS.length}
            active={projectCat}
            onChange={setProjectCat}
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
              <CloudProjectCard
                key={p.id}
                project={p}
                guideSlug={cloudGuideSlug(p.id)}
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
            <EmptyNote>No projects match. Clear the search or widen the filters.</EmptyNote>
          )}
        </section>

        {/* /07 QUIZ */}
        <section id="quiz" className="scroll-mt-28 pt-14 md:scroll-mt-44">
          <SectionHeader num="/07" title="Practice Quiz" count={`${CLOUD_MCQ_COUNT} questions`} />
          <p className="mt-3 mb-5 font-mono text-[11.5px] text-muted-2">
            {"// Test yourself. Immediate feedback and plain-English reasoning — respects the tier, provider, and cert filters above."}
          </p>
          <CloudQuiz tier={tier} provider={provider} cert={cert} />
        </section>

        {/* /08 RESOURCES */}
        <section id="resources" className="scroll-mt-28 pt-14 md:scroll-mt-44">
          <SectionHeader num="/08" title="Free Resources" count={`${RESOURCE_COUNT} free`} />
          <p className="mt-3 mb-6 font-mono text-[11.5px] text-muted-2">
            {"// Hands-on labs, official baselines, open-source tools, practitioner writing, and free cert prep."}
          </p>
          {RESOURCES.map((g) => (
            <ResourceGroupList key={g.group} group={g} />
          ))}
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-hairline px-4 py-8 text-center sm:px-5">
        <p className="mono-label text-faint">
          © Faisal Khan <span aria-hidden>●</span> Cloud security prep kit <span aria-hidden>●</span> Built for the interview
        </p>
        <Link href="/" className="mono-label mt-3 inline-block text-accent-strong hover:underline">
          ← Back to portfolio
        </Link>
      </footer>

      <SocAssistant domain="cloud" />

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
