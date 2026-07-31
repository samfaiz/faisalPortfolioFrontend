"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Project,
  ProjectCategory,
  ProjectCategoryOption,
} from "@/lib/types";
import { displayImage } from "@/lib/project";

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

/** Lab work: no deployed site, but screenshots to show instead of an iframe. */
const isCaseStudy = (p: Project | null) => Boolean(p?.case_study);

/** Every screenshot a case study has, in step order, for the shuffle preview. */
const caseStudyShots = (p: Project | null): string[] => {
  const steps = p?.case_study?.steps ?? [];
  const shots = steps.map((s) => s.image).filter((s): s is string => Boolean(s));
  // The standalone preview image counts too — some projects have one without
  // having filled in any steps yet.
  return p?.preview_image && !shots.includes(p.preview_image)
    ? [p.preview_image, ...shots]
    : shots;
};

/** A case study can fill the pane if it has at least one picture to show. */
const hasShots = (p: Project | null) => caseStudyShots(p).length > 0;

/** What to show first: a demo preview if one exists, else the live frame. */
const defaultMode = (p: Project | null): Mode =>
  hasPreview(p) ? "preview" : canFrame(p) ? "live" : "preview";

/** Anything with a frameable site, a video, or screenshots can fill the pane. */
const canPreview = (p: Project) =>
  canFrame(p) || hasPreview(p) || (isCaseStudy(p) && hasShots(p));

export function LiveViewer({
  projects,
  categories,
}: {
  projects: Project[];
  categories: ProjectCategoryOption[];
}) {
  const [category, setCategory] = useState<ProjectCategory>("all");

  const filters = useMemo(
    () => [
      { label: "ALL", value: "all" as ProjectCategory },
      ...categories.map((c) => ({
        label: c.label.toUpperCase(),
        value: c.slug as ProjectCategory,
      })),
    ],
    [categories],
  );

  /** Cards: everything in the chosen category. */
  const visible = useMemo(
    () => projects.filter((p) => category === "all" || p.category === category),
    [projects, category],
  );

  /** Pane: whatever has something to show — a site, a video, or screenshots. */
  const previewable = useMemo(() => visible.filter(canPreview), [visible]);
  const firstPreviewable = projects.find(canPreview) ?? null;

  const [activeId, setActiveId] = useState<number | null>(firstPreviewable?.id ?? null);

  // Resolved against `previewable`, which is already scoped to the chosen
  // category — so switching category drops a selection no longer in it.
  // Previously picking CYBER SEC left a web-apps site loaded in the frame.
  const active = previewable.find((p) => p.id === activeId) ?? previewable[0] ?? null;

  const [mode, setMode] = useState<Mode>(defaultMode(firstPreviewable));
  const [state, setState] = useState<LoadState>("loading");
  const [isFull, setIsFull] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardsMounted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track fullscreen so the body can flex to fill the screen instead of
  // staying at its fixed in-page height (which left the frame stuck at ~440px).
  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Center the active card in the horizontal (mobile) card strip — scrolling
  // ONLY that strip, never the page. Skips the first render so loading the page
  // doesn't jump down to the projects section.
  useEffect(() => {
    if (!cardsMounted.current) {
      cardsMounted.current = true;
      return;
    }
    const container = cardsRef.current;
    const el = container?.querySelector<HTMLElement>('[data-active="true"]');
    if (!container || !el) return;
    const delta =
      el.getBoundingClientRect().left -
      container.getBoundingClientRect().left -
      (container.clientWidth - el.clientWidth) / 2;
    container.scrollBy({ left: delta, behavior: "smooth" });
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
  // Cycles previewable projects only — stepping onto a case study would put
  // something unloadable in the pane.
  const activeIndex = Math.max(0, previewable.findIndex((p) => p.id === active?.id));
  const go = (dir: number) => {
    if (previewable.length < 2) return;
    select(previewable[(activeIndex + dir + previewable.length) % previewable.length]);
  };

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
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

      {/* Viewer frame — omitted when the chosen category is all case studies,
          which have nothing to load into it. */}
      {previewable.length > 0 && (
      <div
        ref={frameRef}
        className={`shadow-offset flex flex-col overflow-hidden border-ink bg-surface ${
          isFull ? "h-screen w-screen rounded-none border-0" : "rounded-lg border-2"
        }`}
      >
        {/* Header bar — compacts to icons on mobile so it never overflows */}
        <div className="flex items-center gap-2 border-b-[1.5px] border-hairline bg-surface-alt px-3 py-2.5 sm:gap-3 sm:px-4">
          <span className="shrink-0 text-accent" aria-hidden>●</span>
          {/* A case study has no domain, so name what it is instead of "—". */}
          <span className="mono-label min-w-0 flex-1 truncate text-muted">
            {isCaseStudy(active)
              ? `${caseStudyShots(active).length} SCREENSHOT${
                  caseStudyShots(active).length === 1 ? "" : "S"
                }`
              : domainOf(active?.url)}
          </span>
          <span className="mono-label hidden shrink-0 text-faint lg:inline">
            {isCaseStudy(active)
              ? "CASE STUDY"
              : showLive
                ? "RUNNING LIVE IN-PAGE"
                : "DEMO PREVIEW"}
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
      )}

      {/* Prev / next + counter — makes multiple projects obvious on mobile */}
      {previewable.length > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => go(-1)}
            aria-label="Previous project"
            className="mono-label grid size-9 shrink-0 place-items-center rounded-pill border-[1.5px] border-hairline text-ink transition-colors hover:border-ink"
          >
            ←
          </button>
          <span className="mono-label tabular-nums text-muted-2">
            {activeIndex + 1} / {previewable.length} PROJECTS
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
          const caseStudy = isCaseStudy(p);
          // A case study with screenshots is selectable like anything else, so
          // it can be the active card; one without only ever links out.
          const linksOut = caseStudy && !hasShots(p);
          const isActive = !linksOut && p.id === active?.id;

          const card = displayImage(p);

          const body = (
            <>
              {card && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={card}
                  alt=""
                  loading="lazy"
                  className="mb-3 aspect-video w-full rounded-sm border border-hairline bg-surface-alt object-cover object-top"
                />
              )}
              <div className="mono-label flex items-center justify-between gap-2 text-faint">
                <span>{p.category.replace("-", " ")}</span>
                {isActive && <span className="text-accent">▸ NOW SHOWING</span>}
                {caseStudy && !isActive && (
                  <span className="text-accent-strong">CASE STUDY{linksOut ? " →" : ""}</span>
                )}
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
            </>
          );

          const shared =
            "w-[82%] shrink-0 snap-center rounded-md border-[1.5px] p-4 text-left transition-colors md:w-auto md:shrink";

          // A case study with screenshots loads them into the pane like any
          // other project. One without has nothing to show, so its card goes
          // straight to the walkthrough rather than selecting an empty pane.
          return linksOut ? (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className={`${shared} block border-hairline bg-surface hover:border-ink`}
            >
              {body}
            </Link>
          ) : (
            <button
              key={p.id}
              data-active={isActive}
              onClick={() => select(p)}
              className={`${shared} ${
                isActive
                  ? "border-accent bg-accent/10"
                  : "border-hairline bg-surface hover:border-ink"
              }`}
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Case-study preview: the project's screenshots, cycling.
 *
 * Lab work has no site to frame, and a single still left the pane looking
 * unfinished. Cycling the screenshots fills it and previews the walkthrough at
 * the same time. Order is shuffled once per project so the pane does not always
 * open on "install the software" — the least interesting shot in any build.
 */
function ShufflePane({ project }: { project: Project }) {
  const shots = useMemo(() => {
    const all = caseStudyShots(project);
    // Seeded by project id, so the order is stable between server and client
    // render — Math.random() here would cause a hydration mismatch.
    return all
      .map((src, i) => ({ src, k: Math.sin(project.id * 97 + i * 31) }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.src);
  }, [project]);

  // Remounted per project via `key` at the call site, so this starts at 0
  // again on every switch — no reset effect, no cascading render.
  const [i, setI] = useState(0);

  useEffect(() => {
    if (shots.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % shots.length), 4000);
    return () => clearInterval(t);
  }, [shots.length]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-alt">
      {shots.map((src, n) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden={n !== i}
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${
            n === i ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Dots, so it reads as a gallery rather than a page that keeps changing */}
      {shots.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {shots.map((src, n) => (
            <button
              key={src}
              onClick={() => setI(n)}
              aria-label={`Screenshot ${n + 1}`}
              className={`h-1.5 rounded-pill transition-all ${
                n === i ? "w-5 bg-paper" : "w-1.5 bg-paper/50 hover:bg-paper/80"
              }`}
            />
          ))}
        </div>
      )}

      <Link
        href={`/projects/${project.slug}`}
        className="mono-label absolute right-4 top-4 rounded-pill bg-ink px-3 py-1.5 font-semibold text-paper shadow-lg transition-opacity hover:opacity-90"
      >
        VIEW CASE STUDY →
      </Link>
    </div>
  );
}

/** Default preview: a demo video, else a screenshot, else a placeholder. */
function PreviewPane({ active, onRunLive }: { active: Project | null; onRunLive?: () => void }) {
  // Lab work: screenshots instead of an iframe or a video.
  if (active && isCaseStudy(active) && hasShots(active)) {
    return <ShufflePane key={active.id} project={active} />;
  }

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
