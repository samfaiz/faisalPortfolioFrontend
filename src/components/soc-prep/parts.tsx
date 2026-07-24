import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  LEVEL_NAMES,
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
