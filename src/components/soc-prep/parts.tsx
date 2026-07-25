"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FUNDAMENTALS,
  LEVEL_NAMES,
  MALWARE,
  SCENARIOS,
  type Fundamental,
  type Level,
  type MalwareTopic,
  type ResourceGroup,
  type Role,
  type Scenario,
  type Severity,
} from "@/lib/soc-prep/data";
import {
  FUNDAMENTAL_EXTRAS,
  MALWARE_DEFINITIONS,
  SCENARIO_EXPLAINERS,
} from "@/lib/soc-prep/extras";
import { LOG_SOURCES, PLATFORM_NAMES, type LogSource } from "@/lib/soc-prep/logs";
import type { PathModule, PathRef } from "@/lib/soc-prep/path";
import type { Project } from "@/lib/soc-prep/projects";
import { ListenButton, plainText } from "./speech";

/* Tier + severity tints (vars defined in globals.css, theme-aware). */
const LEVEL_STYLES: Record<Level, string> = {
  l1: "bg-(--soc-l1)/15 text-(--soc-l1)",
  l2: "bg-(--soc-l2)/15 text-(--soc-l2)",
  l3: "bg-(--soc-l3)/15 text-(--soc-l3)",
};

/* Solid tier chips (role cards) — static strings so Tailwind can see them. */
const LEVEL_SOLID: Record<Level, string> = {
  l1: "bg-(--soc-l1)",
  l2: "bg-(--soc-l2)",
  l3: "bg-(--soc-l3)",
};

const SEVERITY_STYLES: Record<Severity, string> = {
  high: "bg-destructive/10 text-destructive",
  med: "bg-(--soc-l1)/15 text-(--soc-l1)",
  low: "bg-accent/15 text-accent-strong",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  high: "HIGH",
  med: "MED",
  low: "LOW",
};

const chipClass =
  "rounded-pill border-transparent px-2 font-mono text-[9.5px] font-bold tracking-[0.12em]";

export function LevelBadge({ level }: { level: Level }) {
  return (
    <Badge className={cn(chipClass, LEVEL_STYLES[level])}>
      {LEVEL_NAMES[level]}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge className={cn(chipClass, SEVERITY_STYLES[severity])}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}

/** Mono accent block heading with a trailing hairline (SITUATION, TASK, …). */
function BlockHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono-label flex items-center gap-2.5 text-accent-strong after:h-px after:flex-1 after:bg-divider">
      {children}
    </div>
  );
}

/** Kit content authored as HTML strings (bold, code, tables…). */
function Html({ className, html }: { className?: string; html: string }) {
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function MarkReadButton({
  read,
  onToggle,
}: {
  read: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-pressed={read}
      className={cn(
        "soc-noprint mono-label mt-5 rounded-pill border-[1.5px]",
        read
          ? "border-accent text-accent-strong hover:text-accent-strong"
          : "text-muted-2"
      )}
    >
      {read ? "✓ READ" : "MARK AS READ"}
    </Button>
  );
}

const itemClass =
  "soc-card mb-2 overflow-hidden rounded-md border-[1.5px] border-hairline bg-surface transition-colors not-last:border-b-[1.5px] data-open:border-ink";

const triggerClass =
  "flex-wrap items-center gap-x-3 gap-y-1.5 rounded-none border-transparent p-4 no-underline transition-colors hover:no-underline hover:bg-surface-alt/60 sm:px-5";

const contentClass = "border-t border-divider px-4 pt-4 pb-5 sm:px-5";

export function ScenarioItem({
  scenario: s,
  open,
  read,
  onToggleRead,
}: {
  scenario: Scenario;
  open: boolean;
  read: boolean;
  onToggleRead: () => void;
}) {
  return (
    <AccordionItem value={`sc-${s.id}`} id={`item-sc-${s.id}`} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <span
          className={cn(
            "w-6 shrink-0 font-mono text-[11px] font-bold",
            read ? "text-accent-strong" : "text-faint"
          )}
          aria-hidden
        >
          {read ? "✓" : String(s.id).padStart(2, "0")}
        </span>
        <SeverityBadge severity={s.severity} />
        <span
          className={cn(
            "order-last w-full text-[14.5px] font-medium tracking-[-0.01em] sm:order-none sm:w-auto sm:flex-1",
            read ? "text-muted-2" : "text-ink"
          )}
        >
          {s.title}
          {read && <span className="sr-only"> (read)</span>}
        </span>
        <span className="mono-label hidden text-faint lg:inline">{s.category}</span>
        <LevelBadge level={s.level} />
      </AccordionTrigger>

      {/* One-line TL;DR while collapsed, so the list is skimmable. */}
      {!open && (
        <p className="soc-noprint -mt-1 max-w-(--soc-measure) px-4 pb-3.5 text-[13px] leading-normal text-muted-2 sm:px-5 sm:pl-14">
          <span className="mono-label mr-1.5 text-accent-strong">TL;DR</span>
          {s.task}
        </p>
      )}

      <AccordionContent forceMount className={contentClass}>
        <div className="space-y-5">
          <div className="soc-noprint flex justify-end">
            <ListenButton
              id={`sc-${s.id}`}
              title={s.title}
              kind="Scenario"
              getText={() =>
                [
                  s.title,
                  SCENARIO_EXPLAINERS[s.id]
                    ? "In plain English. " + plainText(SCENARIO_EXPLAINERS[s.id])
                    : "",
                  "The situation. " + plainText(s.situation),
                  "The task. " + plainText(s.task),
                  "Actions taken. " + s.actions.map(plainText).join(". "),
                  "The result. " + plainText(s.result),
                  "Lessons learned. " + s.lessons.map(plainText).join(". "),
                  "A likely follow-up question. " + plainText(s.followUp),
                ]
                  .filter(Boolean)
                  .join(". ")
              }
            />
          </div>
          {SCENARIO_EXPLAINERS[s.id] && (
            <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
              <span className="mono-label mb-1.5 block text-accent-strong">
                In plain English
              </span>
              <Html className="soc-prose" html={SCENARIO_EXPLAINERS[s.id]} />
            </div>
          )}
          <div className="space-y-2">
            <BlockHeading>Situation</BlockHeading>
            <Html className="soc-prose" html={`<p>${s.situation}</p>`} />
          </div>
          <div className="space-y-2">
            <BlockHeading>Task</BlockHeading>
            <Html className="soc-prose" html={`<p>${s.task}</p>`} />
          </div>
          <div className="space-y-2">
            <BlockHeading>Action</BlockHeading>
            <Html
              className="soc-prose"
              html={`<ol>${s.actions.map((a) => `<li>${a}</li>`).join("")}</ol>`}
            />
          </div>
          <div className="space-y-2">
            <BlockHeading>Result</BlockHeading>
            <Html className="soc-prose" html={`<p>${s.result}</p>`} />
          </div>
          <div className="space-y-2">
            <BlockHeading>Lessons</BlockHeading>
            <Html
              className="soc-prose"
              html={`<ul>${s.lessons.map((l) => `<li>${l}</li>`).join("")}</ul>`}
            />
            {s.attack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.attack.map((t) => (
                  <span
                    key={t}
                    className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[9.5px] text-muted-2"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
            <span className="mono-label mb-1.5 block text-accent-strong">
              Likely follow-up
            </span>
            <Html
              className="text-[15px] font-medium leading-relaxed text-ink"
              html={`“${s.followUp}”`}
            />
          </div>

          <MarkReadButton read={read} onToggle={onToggleRead} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function MalwareItem({
  topic: m,
  read,
  onToggleRead,
}: {
  topic: MalwareTopic;
  read: boolean;
  onToggleRead: () => void;
}) {
  return (
    <AccordionItem value={`ma-${m.id}`} id={`item-ma-${m.id}`} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <span
          className={cn(
            "w-6 shrink-0 font-mono text-[13px] font-bold",
            read ? "text-accent-strong" : "text-accent-strong/80"
          )}
          aria-hidden
        >
          {read ? "✓" : m.id}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 text-[14.5px] font-medium tracking-[-0.01em]",
            read ? "text-muted-2" : "text-ink"
          )}
        >
          {m.title}
          {read && <span className="sr-only"> (read)</span>}
        </span>
        <LevelBadge level={m.level} />
      </AccordionTrigger>
      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-5 flex justify-end">
          <ListenButton
            id={`ma-${m.id}`}
            title={m.title}
            kind="Malware topic"
            getText={() =>
              [
                m.title,
                MALWARE_DEFINITIONS[m.id]
                  ? "Definition. " + plainText(MALWARE_DEFINITIONS[m.id])
                  : "",
                plainText(m.body),
                "A real case to attach it to. " + plainText(m.caseStudy),
              ]
                .filter(Boolean)
                .join(". ")
            }
          />
        </div>
        {MALWARE_DEFINITIONS[m.id] && (
          <div className="mb-5 space-y-2">
            <BlockHeading>Definition</BlockHeading>
            <Html className="soc-prose" html={MALWARE_DEFINITIONS[m.id]} />
          </div>
        )}
        <Html className="soc-prose" html={m.body} />
        <div className="mt-5 space-y-2">
          <BlockHeading>Real case to attach it to</BlockHeading>
          <Html className="soc-prose" html={`<p>${m.caseStudy}</p>`} />
        </div>
        <MarkReadButton read={read} onToggle={onToggleRead} />
      </AccordionContent>
    </AccordionItem>
  );
}

export function FundamentalItem({
  fundamental: q,
  index,
}: {
  fundamental: Fundamental;
  index: number;
}) {
  const extra = FUNDAMENTAL_EXTRAS[q.question];
  return (
    <AccordionItem value={`qa-${index}`} id={`item-qa-${index}`} className={itemClass}>
      <AccordionTrigger className={cn(triggerClass, "py-3.5")}>
        <LevelBadge level={q.level} />
        <span className="order-last w-full text-sm font-medium text-ink sm:order-none sm:w-auto sm:flex-1">
          {q.question}
        </span>
        <span className="mono-label hidden text-faint lg:inline">{q.category}</span>
      </AccordionTrigger>
      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex justify-end">
          <ListenButton
            id={`qa-${index}`}
            title={q.question}
            kind="Fundamental"
            getText={() =>
              [
                q.question,
                extra ? "Definition. " + plainText(extra.definition) : "",
                extra
                  ? "The interview answer. " + plainText(q.answer)
                  : plainText(q.answer),
                extra
                  ? "Real-life implementation. " + plainText(extra.realWorld)
                  : "",
              ]
                .filter(Boolean)
                .join(". ")
            }
          />
        </div>
        {extra ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <BlockHeading>Definition</BlockHeading>
              <Html className="soc-prose" html={extra.definition} />
            </div>
            <div className="space-y-2">
              <BlockHeading>The interview answer</BlockHeading>
              <Html className="soc-prose" html={q.answer} />
            </div>
            <div className="space-y-2">
              <BlockHeading>Real-life implementation</BlockHeading>
              <Html className="soc-prose" html={extra.realWorld} />
            </div>
          </div>
        ) : (
          <Html className="soc-prose" html={q.answer} />
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

const REF_KIND_LABEL: Record<PathRef["kind"], string> = {
  qa: "Fundamental",
  lg: "Log",
  sc: "Scenario",
  ma: "Malware",
};

/** The full content of a referenced card, rendered inline inside a module so
 *  you never lose your place in the path. */
function RefContent({ refItem }: { refItem: PathRef }) {
  if (refItem.kind === "qa") {
    const q = FUNDAMENTALS[Number(refItem.id)];
    if (!q) return null;
    const extra = FUNDAMENTAL_EXTRAS[q.question];
    return (
      <div className="space-y-4">
        {extra && (
          <div className="space-y-1.5">
            <BlockHeading>Definition</BlockHeading>
            <Html className="soc-prose" html={extra.definition} />
          </div>
        )}
        <div className="space-y-1.5">
          <BlockHeading>{extra ? "The interview answer" : "Answer"}</BlockHeading>
          <Html className="soc-prose" html={q.answer} />
        </div>
        {extra && (
          <div className="space-y-1.5">
            <BlockHeading>Real-life implementation</BlockHeading>
            <Html className="soc-prose" html={extra.realWorld} />
          </div>
        )}
      </div>
    );
  }

  if (refItem.kind === "lg") {
    const l = LOG_SOURCES.find((x) => x.id === Number(refItem.id));
    if (!l) return null;
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <BlockHeading>What it records</BlockHeading>
          <Html className="soc-prose" html={l.what} />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>Where to find it</BlockHeading>
          <Html className="soc-prose" html={l.where} />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>Sample entry</BlockHeading>
          <pre className="overflow-x-auto rounded-r-md border-l-2 border-accent bg-panel px-4 py-3.5 font-mono text-[12px] leading-relaxed text-on-dark">
            {l.sample}
          </pre>
        </div>
        <div className="space-y-1.5">
          <BlockHeading>How to read it</BlockHeading>
          <Html className="soc-prose" html={l.fields} />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>What to look for</BlockHeading>
          <Html
            className="soc-prose"
            html={`<ul>${l.lookFor.map((x) => `<li>${x}</li>`).join("")}</ul>`}
          />
        </div>
        <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3">
          <span className="mono-label mb-1 block text-accent-strong">Real case</span>
          <Html className="soc-prose" html={l.scenario} />
        </div>
      </div>
    );
  }

  if (refItem.kind === "sc") {
    const s = SCENARIOS.find((x) => x.id === Number(refItem.id));
    if (!s) return null;
    const plain = SCENARIO_EXPLAINERS[s.id];
    return (
      <div className="space-y-4">
        {plain && (
          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3">
            <span className="mono-label mb-1 block text-accent-strong">In plain English</span>
            <Html className="soc-prose" html={plain} />
          </div>
        )}
        <div className="space-y-1.5">
          <BlockHeading>Situation</BlockHeading>
          <Html className="soc-prose" html={`<p>${s.situation}</p>`} />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>Task</BlockHeading>
          <Html className="soc-prose" html={`<p>${s.task}</p>`} />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>Action</BlockHeading>
          <Html
            className="soc-prose"
            html={`<ol>${s.actions.map((a) => `<li>${a}</li>`).join("")}</ol>`}
          />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>Result</BlockHeading>
          <Html className="soc-prose" html={`<p>${s.result}</p>`} />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>Lessons</BlockHeading>
          <Html
            className="soc-prose"
            html={`<ul>${s.lessons.map((x) => `<li>${x}</li>`).join("")}</ul>`}
          />
        </div>
        <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3">
          <span className="mono-label mb-1 block text-accent-strong">Likely follow-up</span>
          <p className="text-[15px] font-medium leading-relaxed text-ink">“{s.followUp}”</p>
        </div>
      </div>
    );
  }

  const m = MALWARE.find((x) => x.id === String(refItem.id));
  if (!m) return null;
  return (
    <div className="space-y-4">
      {MALWARE_DEFINITIONS[m.id] && (
        <div className="space-y-1.5">
          <BlockHeading>Definition</BlockHeading>
          <Html className="soc-prose" html={MALWARE_DEFINITIONS[m.id]} />
        </div>
      )}
      <Html className="soc-prose" html={m.body} />
      <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3">
        <span className="mono-label mb-1 block text-accent-strong">Real case</span>
        <Html className="soc-prose" html={`<p>${m.caseStudy}</p>`} />
      </div>
    </div>
  );
}

/** One numbered step in a module — expands its content in place. */
function RefStep({
  refItem,
  index,
  onGoTo,
}: {
  refItem: PathRef;
  index: number;
  onGoTo: (ref: PathRef) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="overflow-hidden rounded-md border border-hairline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "group flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-alt/60",
          open && "border-b border-divider bg-surface-alt/40"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "font-mono text-[11px] font-bold",
            open ? "text-accent-strong" : "text-faint group-hover:text-accent-strong"
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1 text-[14px] text-ink">{refItem.label}</span>
        <span className="mono-label hidden text-faint sm:inline">
          {REF_KIND_LABEL[refItem.kind]}
        </span>
        <span
          aria-hidden
          className={cn(
            "font-mono text-xs transition-transform",
            open ? "rotate-180 text-accent-strong" : "text-faint"
          )}
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="px-3.5 py-4">
          <RefContent refItem={refItem} />
          <button
            type="button"
            onClick={() => onGoTo(refItem)}
            className="mono-label soc-noprint mt-4 text-faint transition-colors hover:text-ink"
          >
            open in {REF_KIND_LABEL[refItem.kind].toLowerCase()} section ↗
          </button>
        </div>
      )}
    </li>
  );
}

export function PathModuleCard({
  module: m,
  done,
  onToggleDone,
  onGoTo,
}: {
  module: PathModule;
  done: boolean;
  onToggleDone: () => void;
  onGoTo: (ref: PathRef) => void;
}) {
  return (
    <AccordionItem value={`pm-${m.id}`} id={`item-pm-${m.id}`} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-pill border-[1.5px] font-mono text-[11px] font-bold",
            done ? "border-accent bg-accent text-paper" : "border-hairline text-muted-2"
          )}
          aria-hidden
        >
          {done ? "✓" : String(m.id).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "order-last w-full text-[14.5px] font-medium tracking-[-0.01em] sm:order-none sm:w-auto sm:flex-1",
            done ? "text-muted-2" : "text-ink"
          )}
        >
          {m.title}
          {done && <span className="sr-only"> (complete)</span>}
        </span>
        <span className="mono-label hidden text-faint lg:inline">{m.minutes} min</span>
      </AccordionTrigger>

      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex justify-end">
          <ListenButton
            id={`pm-${m.id}`}
            title={m.title}
            kind="Study module"
            getText={() =>
              [
                `Module ${m.id}. ${m.title}`,
                "The goal. " + m.goal,
                "This module covers. " + m.covers.join(". "),
                "Your checkpoint. " + m.checkpoint,
              ].join(". ")
            }
          />
        </div>

        <div className="space-y-5">
          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
            <span className="mono-label mb-1.5 block text-accent-strong">Goal</span>
            <p className="soc-prose">{m.goal}</p>
          </div>

          {m.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={m.image}
              alt={m.imageAlt ?? ""}
              loading="lazy"
              className="w-full rounded-md border border-hairline bg-surface-alt"
              onError={(e) => {
                // Diagram not added yet — hide the slot rather than showing a broken image.
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}

          <div className="space-y-2">
            <BlockHeading>What this covers</BlockHeading>
            <ul className="soc-prose list-disc pl-5">
              {m.covers.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          {m.refs.length > 0 && (
            <div className="space-y-2">
              <BlockHeading>Work through these, in order</BlockHeading>
              <p className="mono-label text-faint">Tap a step to read it here</p>
              <ol className="space-y-2">
                {m.refs.map((r, i) => (
                  <RefStep key={`${r.kind}-${r.id}`} refItem={r} index={i} onGoTo={onGoTo} />
                ))}
              </ol>
            </div>
          )}

          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
            <span className="mono-label mb-1.5 block text-accent-strong">Checkpoint</span>
            <p className="soc-prose">{m.checkpoint}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDone}
            aria-pressed={done}
            className={cn(
              "soc-noprint mono-label rounded-pill border-[1.5px]",
              done ? "border-accent text-accent-strong" : "text-muted-2"
            )}
          >
            {done ? "✓ MODULE COMPLETE" : "MARK MODULE COMPLETE"}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function ProjectCard({
  project: p,
  built,
  onToggleBuilt,
}: {
  project: Project;
  built: boolean;
  onToggleBuilt: () => void;
}) {
  return (
    <AccordionItem value={`pj-${p.id}`} id={`item-pj-${p.id}`} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-pill border-[1.5px] font-mono text-[11px] font-bold",
            built ? "border-accent bg-accent text-paper" : "border-hairline text-muted-2"
          )}
          aria-hidden
        >
          {built ? "✓" : String(p.id).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "order-last w-full text-[14.5px] font-medium tracking-[-0.01em] sm:order-none sm:w-auto sm:flex-1",
            built ? "text-muted-2" : "text-ink"
          )}
        >
          {p.title}
          {built && <span className="sr-only"> (built)</span>}
        </span>
        <span className="mono-label hidden text-faint xl:inline">{p.hours}</span>
        <LevelBadge level={p.level} />
      </AccordionTrigger>

      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-pill border border-hairline px-2 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-muted-2">
              {p.category.toUpperCase()}
            </span>
            <span className="rounded-pill border border-hairline px-2 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-muted-2">
              {p.hours}
            </span>
            <span className="rounded-pill border border-accent px-2 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-accent-strong">
              {p.cost}
            </span>
          </div>
          <ListenButton
            id={`pj-${p.id}`}
            title={p.title}
            kind="Project"
            getText={() =>
              [
                p.title,
                p.tagline,
                "What you end up with. " + plainText(p.outcome),
                "Why it matters. " + p.proves,
                "The steps. " +
                  p.steps.map((s, i) => `Step ${i + 1}. ${s.title}. ${plainText(s.detail)}`).join(" "),
                "How you know it worked. " + p.validation.map(plainText).join(". "),
              ].join(". ")
            }
          />
        </div>

        <div className="space-y-5">
          <p className="soc-prose max-w-(--soc-measure) text-[15px] font-medium text-ink">
            {p.tagline}
          </p>

          <div className="space-y-2">
            <BlockHeading>What you end up with</BlockHeading>
            <Html className="soc-prose" html={p.outcome} />
          </div>

          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
            <span className="mono-label mb-1.5 block text-accent-strong">
              Why it&rsquo;s worth doing
            </span>
            <p className="soc-prose">{p.proves}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <BlockHeading>Stack</BlockHeading>
              <ul className="flex flex-wrap gap-1.5">
                {p.stack.map((t) => (
                  <li
                    key={t}
                    className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-muted-2"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <BlockHeading>Before you start</BlockHeading>
              <Html
                className="soc-prose"
                html={`<ul>${p.prerequisites.map((x) => `<li>${x}</li>`).join("")}</ul>`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <BlockHeading>Step by step</BlockHeading>
            <ol className="space-y-3">
              {p.steps.map((s, i) => (
                <li key={i} className="rounded-md border border-hairline p-4">
                  <div className="flex items-baseline gap-3">
                    <span
                      aria-hidden
                      className="shrink-0 font-mono text-[11px] font-bold text-accent-strong"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h4 className="text-[14.5px] font-semibold text-ink">{s.title}</h4>
                  </div>
                  <Html className="soc-prose mt-2 pl-8" html={s.detail} />
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-2">
            <BlockHeading>How you know it worked</BlockHeading>
            <ul className="space-y-2">
              {p.validation.map((v, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden className="mt-0.5 shrink-0 font-mono text-[11px] text-accent-strong">
                    ☐
                  </span>
                  <Html className="soc-prose flex-1" html={v} />
                </li>
              ))}
            </ul>
          </div>

          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
            <span className="mono-label mb-1.5 block text-accent-strong">
              How to talk about it in the interview
            </span>
            <p className="text-[15px] leading-relaxed text-ink">{p.pitch}</p>
          </div>

          <div className="space-y-2">
            <BlockHeading>Take it further</BlockHeading>
            <Html
              className="soc-prose"
              html={`<ul>${p.stretch.map((x) => `<li>${x}</li>`).join("")}</ul>`}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleBuilt}
            aria-pressed={built}
            className={cn(
              "soc-noprint mono-label rounded-pill border-[1.5px]",
              built ? "border-accent text-accent-strong" : "text-muted-2"
            )}
          >
            {built ? "✓ BUILT" : "MARK AS BUILT"}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function LogSourceCard({ source: s }: { source: LogSource }) {
  return (
    <AccordionItem value={`lg-${s.id}`} id={`item-lg-${s.id}`} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <span className="w-6 shrink-0 font-mono text-[11px] font-bold text-faint" aria-hidden>
          {String(s.id).padStart(2, "0")}
        </span>
        <span className="order-last w-full text-[14.5px] font-medium tracking-[-0.01em] text-ink sm:order-none sm:w-auto sm:flex-1">
          {s.name}
        </span>
        <span className="mono-label hidden text-faint lg:inline">
          {PLATFORM_NAMES[s.platform]}
        </span>
        <LevelBadge level={s.level} />
      </AccordionTrigger>

      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex justify-end">
          <ListenButton
            id={`lg-${s.id}`}
            title={s.name}
            kind="Log source"
            getText={() =>
              [
                s.name,
                "What it records. " + plainText(s.what),
                "Where to find it. " + plainText(s.where),
                "How to read it. " + plainText(s.fields),
                "What to look for. " + s.lookFor.map(plainText).join(". "),
                "A real case. " + plainText(s.scenario),
              ].join(". ")
            }
          />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <BlockHeading>What it records</BlockHeading>
            <Html className="soc-prose" html={s.what} />
          </div>

          <div className="space-y-2">
            <BlockHeading>Where to find it</BlockHeading>
            <Html className="soc-prose" html={s.where} />
          </div>

          <div className="space-y-2">
            <BlockHeading>Sample entry</BlockHeading>
            <pre className="overflow-x-auto rounded-r-md border-l-2 border-accent bg-panel px-4 py-3.5 font-mono text-[12px] leading-relaxed text-on-dark">
              {s.sample}
            </pre>
          </div>

          <div className="space-y-2">
            <BlockHeading>How to read it</BlockHeading>
            <Html className="soc-prose" html={s.fields} />
          </div>

          <div className="space-y-2">
            <BlockHeading>What to look for</BlockHeading>
            <Html
              className="soc-prose"
              html={`<ul>${s.lookFor.map((l) => `<li>${l}</li>`).join("")}</ul>`}
            />
          </div>

          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
            <span className="mono-label mb-1.5 block text-accent-strong">
              Real case — this log was the answer
            </span>
            <Html className="soc-prose" html={s.scenario} />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function RoleCard({ role: r }: { role: Role }) {
  return (
    <article className="rounded-lg border-[1.5px] border-hairline bg-surface p-5 sm:p-6">
      <Badge className={cn(chipClass, "mb-3 text-paper", LEVEL_SOLID[r.level])}>
        TIER {r.level.slice(1)}
      </Badge>
      <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
        {r.title}
      </h3>
      <p className="mono-label mt-0.5 mb-4 text-muted-2">{r.range}</p>
      <Html
        className="soc-prose"
        html={`<ol class="soc-steps">${r.items.map((i) => `<li>${i}</li>`).join("")}</ol>`}
      />
      <p className="mono-label mt-4 border-t border-divider pt-3 text-faint">
        {r.kpi}
      </p>
    </article>
  );
}

export function ResourceGroupList({ group }: { group: ResourceGroup }) {
  return (
    <div className="mb-9">
      <h3 className="mono-label flex items-center gap-2 border-b border-hairline pb-2 text-ink">
        {group.group}
        <span className="text-faint">· {group.items.length}</span>
      </h3>
      <ul>
        {group.items.map((i) => (
          <li key={i.url}>
            <a
              href={i.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-wrap items-baseline gap-x-4 gap-y-0.5 border-b border-divider px-1.5 py-3 transition-colors hover:bg-surface-alt/60"
            >
              <span className="text-sm font-medium text-ink group-hover:text-accent-strong">
                {i.name}
              </span>
              <span className="order-last w-full text-[13px] text-muted md:order-none md:w-auto md:flex-1">
                {i.description}
              </span>
              <span className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-muted-2">
                {i.tag}
              </span>
              <span
                aria-hidden
                className="font-mono text-xs text-faint group-hover:text-accent-strong"
              >
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-hairline py-8 text-center font-mono text-xs text-muted-2">
      {children}
    </p>
  );
}
