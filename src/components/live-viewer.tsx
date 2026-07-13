"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project, ProjectCategory } from "@/lib/types";

const FILTERS: { label: string; value: ProjectCategory }[] = [
  { label: "ALL", value: "all" },
  { label: "CYBER SEC", value: "cyber-sec" },
  { label: "WEB DEV", value: "web-dev" },
  { label: "WEB APPS", value: "web-apps" },
];

type Mode = "preview" | "live";
type LoadState = "loading" | "ready" | "blocked";

function domainOf(url: string | null | undefined): string {
  if (!url) return "—";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const hasPreview = (p: Project | null) =>
  Boolean(p?.preview_video || p?.preview_image);

const canFrame = (p: Project | null) => Boolean(p && p.allow_iframe && p.url);

/** What to show first: a demo preview if one exists, else the live frame. */
const defaultMode = (p: Project | null): Mode =>
  hasPreview(p) ? "preview" : canFrame(p) ? "live" : "preview";

export function LiveViewer({ projects }: { projects: Project[] }) {
  const [category, setCategory] = useState<ProjectCategory>("all");
  const visible = useMemo(
    () => projects.filter((p) => category === "all" || p.category === category),
    [projects, category],
  );

  const [activeId, setActiveId] = useState<number | null>(projects[0]?.id ?? null);
  const active = projects.find((p) => p.id === activeId) ?? visible[0] ?? projects[0] ?? null;

  const [mode, setMode] = useState<Mode>(defaultMode(projects[0] ?? null));
  const [state, setState] = useState<LoadState>("loading");
  const [isFull, setIsFull] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track fullscreen so the body can flex to fill the screen instead of
  // staying at its fixed in-page height (which left the frame stuck at ~440px).
  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Keep the active card centered in the horizontal (mobile) card strip.
  useEffect(() => {
    cardsRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeId]);

  const select = (p: Project) => {
    setActiveId(p.id);
    setMode(defaultMode(p));
    setState(p.allow_iframe === false ? "blocked" : "loading");
  };

  const runLive = () => {
    setMode("live");
    setState(active?.allow_iframe === false ? "blocked" : "loading");
  };

  const onFrameLoad = () => {
    if (timer.current) clearTimeout(timer.current);
    setState("ready");
  };

  // If the site blocks framing (X-Frame-Options / CSP), onLoad often never
  // fires — fall back to an "open in new tab" state after a short wait.
  const armBlockedTimeout = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState((s) => (s === "loading" ? "blocked" : s)), 4500);
  };

  const goFullscreen = () => frameRef.current?.requestFullscreen?.();

  const showLive = mode === "live";
  const liveBlocked = state === "blocked" || !active?.url || active?.allow_iframe === false;

  // Position + prev/next so mobile users can tell there are multiple projects
  // and cycle through them without hunting for the cards below the tall frame.
  const activeIndex = Math.max(0, visible.findIndex((p) => p.id === active?.id));
  const go = (dir: number) => {
    if (visible.length < 2) return;
    select(visible[(activeIndex + dir + visible.length) % visible.length]);
  };

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setCategory(f.value)}
            className={`mono-label rounded-pill border-[1.5px] px-3 py-1.5 transition-colors ${
              category === f.value
                ? "border-ink bg-ink text-paper"
                : "border-hairline text-muted-2 hover:border-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Viewer frame */}
      <div
        ref={frameRef}
        className={`shadow-offset flex flex-col overflow-hidden border-ink bg-surface ${
          isFull ? "h-screen w-screen rounded-none border-0" : "rounded-lg border-2"
        }`}
      >
        {/* Header bar — compacts to icons on mobile so it never overflows */}
        <div className="flex items-center gap-2 border-b-[1.5px] border-hairline bg-surface-alt px-3 py-2.5 sm:gap-3 sm:px-4">
          <span className="shrink-0 text-accent" aria-hidden>●</span>
          <span className="mono-label min-w-0 flex-1 truncate text-muted">{domainOf(active?.url)}</span>
          <span className="mono-label hidden shrink-0 text-faint lg:inline">
            {showLive ? "RUNNING LIVE IN-PAGE" : "DEMO PREVIEW"}
          </span>

          {/* Toggle between preview and live when both are available */}
          {hasPreview(active) && canFrame(active) && (
            <button
              onClick={() => (showLive ? setMode("preview") : runLive())}
              className="mono-label shrink-0 rounded-pill border-[1.5px] border-hairline px-2.5 py-1 text-ink hover:border-ink"
            >
              {showLive ? "◀ PREVIEW" : "RUN LIVE ▸"}
            </button>
          )}

          <button
            onClick={goFullscreen}
            title="Fullscreen"
            className="mono-label shrink-0 rounded-pill border-[1.5px] border-hairline px-2.5 py-1 text-ink hover:border-ink"
          >
            <span className="hidden sm:inline">FULLSCREEN </span>⤢
          </button>
          {active?.url && (
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="mono-label shrink-0 rounded-pill border-[1.5px] border-hairline px-2.5 py-1 text-ink hover:border-ink"
            >
              <span className="hidden sm:inline">OPEN TAB </span>↗
            </a>
          )}
        </div>

        {/* Body */}
        <div
          className={`relative bg-ink/[0.03] ${
            isFull ? "min-h-0 flex-1" : "h-[380px] sm:h-[440px]"
          }`}
        >
          {showLive ? (
            liveBlocked ? (
              <BlockedCard active={active} onBackToPreview={hasPreview(active) ? () => setMode("preview") : undefined} />
            ) : (
              <>
                {state === "loading" && (
                  <div className="stripes absolute inset-0 grid place-items-center">
                    <span className="mono-label animate-pulse text-muted-2">loading {domainOf(active?.url)}…</span>
                  </div>
                )}
                <iframe
                  key={active?.id}
                  src={active?.url ?? undefined}
                  title={active?.title}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  className="h-full w-full"
                  onLoad={onFrameLoad}
                  onError={() => setState("blocked")}
                  ref={armBlockedTimeout}
                />
              </>
            )
          ) : (
            <PreviewPane active={active} onRunLive={canFrame(active) ? runLive : undefined} />
          )}
        </div>
      </div>

      {/* Prev / next + counter — makes multiple projects obvious on mobile */}
      {visible.length > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => go(-1)}
            aria-label="Previous project"
            className="mono-label grid size-9 shrink-0 place-items-center rounded-pill border-[1.5px] border-hairline text-ink transition-colors hover:border-ink"
          >
            ←
          </button>
          <span className="mono-label tabular-nums text-muted-2">
            {activeIndex + 1} / {visible.length} PROJECTS
          </span>
          <button
            onClick={() => go(1)}
            aria-label="Next project"
            className="mono-label grid size-9 shrink-0 place-items-center rounded-pill border-[1.5px] border-hairline text-ink transition-colors hover:border-ink"
          >
            →
          </button>
          <span className="mono-label ml-auto text-faint md:hidden">SWIPE →</span>
        </div>
      )}

      {/* Project cards — horizontal swipe on mobile (next card peeks), grid on desktop */}
      <div
        ref={cardsRef}
        className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:mt-5 md:grid md:grid-cols-3 md:overflow-visible md:pb-0"
      >
        {visible.map((p) => {
          const isActive = p.id === active?.id;
          return (
            <button
              key={p.id}
              data-active={isActive}
              onClick={() => select(p)}
              className={`w-[82%] shrink-0 snap-center rounded-md border-[1.5px] p-4 text-left transition-colors md:w-auto md:shrink ${
                isActive
                  ? "border-accent bg-accent/10"
                  : "border-hairline bg-surface hover:border-ink"
              }`}
            >
              <div className="mono-label flex items-center justify-between text-faint">
                <span>{p.category.replace("-", " ")}</span>
                {isActive && <span className="text-accent">▸ NOW SHOWING</span>}
              </div>
              <div className="mt-2 font-display text-lg font-semibold text-ink">{p.title}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-2">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
                    {t}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Default preview: a demo video, else a screenshot, else a placeholder. */
function PreviewPane({ active, onRunLive }: { active: Project | null; onRunLive?: () => void }) {
  const runButton = onRunLive ? (
    <button
      onClick={onRunLive}
      className="mono-label absolute bottom-4 left-1/2 -translate-x-1/2 rounded-pill bg-ink px-4 py-2 font-semibold text-paper shadow-lg transition-opacity hover:opacity-90"
    >
      ▸ RUN LIVE IN-PAGE
    </button>
  ) : null;

  if (active?.preview_video) {
    return (
      <div className="relative h-full w-full bg-black">
        <video
          key={active.id}
          src={active.preview_video}
          poster={active.preview_image ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="h-full w-full object-contain"
        />
        {runButton}
      </div>
    );
  }

  if (active?.preview_image) {
    return (
      <div className="relative h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={active.preview_image} alt={active.title} className="h-full w-full object-cover object-top" />
        {runButton}
      </div>
    );
  }

  // No preview media and not embeddable → point to the live site.
  return (
    <div className="stripes grid h-full place-items-center">
      <div className="rounded-md border-[1.5px] border-hairline bg-surface px-5 py-4 text-center">
        <div className="mono-label text-muted-2">
          {active?.allow_iframe === false ? "this site blocks in-page framing" : "no preview added yet"}
        </div>
        {active?.url && (
          <a href={active.url} target="_blank" rel="noopener noreferrer" className="mono-label mt-2 inline-block rounded-pill bg-ink px-3 py-1.5 text-paper">
            OPEN IN NEW TAB ↗
          </a>
        )}
      </div>
    </div>
  );
}

/** Shown when the live frame is blocked — offer the video/screenshot or a new tab. */
function BlockedCard({ active, onBackToPreview }: { active: Project | null; onBackToPreview?: () => void }) {
  return (
    <div className="stripes grid h-full place-items-center">
      <div className="rounded-md border-[1.5px] border-hairline bg-surface px-5 py-4 text-center">
        <div className="mono-label text-muted-2">this site blocks in-page framing</div>
        <div className="mt-2 flex items-center justify-center gap-2">
          {onBackToPreview && (
            <button onClick={onBackToPreview} className="mono-label rounded-pill border-[1.5px] border-hairline px-3 py-1.5 text-ink hover:border-ink">
              ◀ PREVIEW
            </button>
          )}
          {active?.url && (
            <a href={active.url} target="_blank" rel="noopener noreferrer" className="mono-label inline-block rounded-pill bg-ink px-3 py-1.5 text-paper">
              OPEN IN NEW TAB ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
