"use client";

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
  PILLAR_NAMES,
  type Fundamental,
  type Level,
  type Pillar,
  type Role,
} from "@/lib/seo-prep/data";
import { ListenButton, plainText } from "@/components/soc-prep/speech";

/* Level tints — static strings so Tailwind can see them at build time. */
const LEVEL_STYLES: Record<Level, string> = {
  junior: "bg-(--seo-junior)/15 text-(--seo-junior)",
  mid: "bg-(--seo-mid)/15 text-(--seo-mid)",
  senior: "bg-(--seo-senior)/15 text-(--seo-senior)",
};

const LEVEL_SOLID: Record<Level, string> = {
  junior: "bg-(--seo-junior)",
  mid: "bg-(--seo-mid)",
  senior: "bg-(--seo-senior)",
};

const chipClass =
  "rounded-pill border-transparent px-2 font-mono text-[9.5px] font-bold tracking-[0.12em]";

export function LevelBadge({ level }: { level: Level }) {
  return (
    <Badge className={cn(chipClass, LEVEL_STYLES[level])}>
      {LEVEL_NAMES[level].toUpperCase()}
    </Badge>
  );
}

export function PillarTag({ pillar }: { pillar: Pillar }) {
  return (
    <span className="rounded-pill border border-hairline px-2 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-muted-2">
      {PILLAR_NAMES[pillar].toUpperCase()}
    </span>
  );
}

function BlockHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono-label flex items-center gap-2.5 text-accent-strong after:h-px after:flex-1 after:bg-divider">
      {children}
    </div>
  );
}

function Html({ className, html }: { className?: string; html: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

const itemClass =
  "soc-card mb-2 overflow-hidden rounded-md border-[1.5px] border-hairline bg-surface transition-colors not-last:border-b-[1.5px] data-open:border-ink";

const triggerClass =
  "flex-wrap items-center gap-x-3 gap-y-1.5 rounded-none border-transparent p-4 no-underline transition-colors hover:no-underline hover:bg-surface-alt/60 sm:px-5";

const contentClass = "border-t border-divider px-4 pt-4 pb-5 sm:px-5";

/* -------------------------------------------------------------------------- */
/* Fundamental                                                                 */
/* -------------------------------------------------------------------------- */

export function FundamentalCard({
  fundamental: f,
  index,
  read,
  onToggleRead,
}: {
  fundamental: Fundamental;
  index: number;
  read: boolean;
  onToggleRead: () => void;
}) {
  return (
    <AccordionItem
      value={`fn-${index}`}
      id={`item-fn-${index}`}
      className={itemClass}
    >
      <AccordionTrigger className={triggerClass}>
        <span
          className={cn(
            "w-6 shrink-0 font-mono text-[11px] font-bold",
            read ? "text-accent-strong" : "text-faint"
          )}
          aria-hidden
        >
          {read ? "✓" : String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "order-last w-full text-[14.5px] font-medium tracking-[-0.01em] sm:order-none sm:w-auto sm:flex-1",
            read ? "text-muted-2" : "text-ink"
          )}
        >
          {f.title}
          {read && <span className="sr-only"> (read)</span>}
        </span>
        <span className="mono-label hidden text-faint lg:inline">
          {f.category}
        </span>
        <LevelBadge level={f.level} />
      </AccordionTrigger>

      <AccordionContent forceMount className={contentClass}>
        <div className="space-y-5">
          <div className="soc-noprint flex flex-wrap items-center justify-between gap-2">
            <PillarTag pillar={f.pillar} />
            <ListenButton
              id={`fn-${index}`}
              title={f.title}
              kind="Fundamental"
              getText={() =>
                [
                  f.title,
                  "In plain English. " + plainText(f.plain),
                  "In more depth. " + plainText(f.detail),
                  "In the real world. " + plainText(f.realWorld),
                  f.pitfall ? "The common mistake. " + plainText(f.pitfall) : "",
                ]
                  .filter(Boolean)
                  .join(". ")
              }
            />
          </div>

          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
            <span className="mono-label mb-1.5 block text-accent-strong">
              In plain English
            </span>
            <Html className="soc-prose" html={f.plain} />
          </div>

          <div className="space-y-2">
            <BlockHeading>In more depth</BlockHeading>
            <Html className="soc-prose" html={f.detail} />
          </div>

          <div className="space-y-2">
            <BlockHeading>In the real world</BlockHeading>
            <Html className="soc-prose" html={f.realWorld} />
          </div>

          {f.pitfall && (
            <div className="max-w-(--soc-measure) rounded-md border border-(--seo-senior) bg-(--seo-senior)/10 px-4 py-3">
              <span className="mono-label mb-1.5 block text-(--seo-senior)">
                ⚠ What people get wrong
              </span>
              <Html className="soc-prose" html={f.pitfall} />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleRead}
            aria-pressed={read}
            className={cn(
              "soc-noprint mono-label rounded-pill border-[1.5px]",
              read
                ? "border-accent text-accent-strong hover:text-accent-strong"
                : "text-muted-2"
            )}
          >
            {read ? "✓ READ" : "MARK AS READ"}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* -------------------------------------------------------------------------- */
/* Role                                                                        */
/* -------------------------------------------------------------------------- */

export function RoleCard({ role: r }: { role: Role }) {
  return (
    <article className="soc-card overflow-hidden rounded-lg border-[1.5px] border-hairline bg-surface">
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3",
          LEVEL_SOLID[r.level]
        )}
      >
        <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-paper">
          {LEVEL_NAMES[r.level].toUpperCase()}
        </span>
        <h3 className="text-[15px] font-semibold text-paper">{r.title}</h3>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="space-y-2">
          <BlockHeading>Titles you will see</BlockHeading>
          <ul className="flex flex-wrap gap-1.5">
            {r.titles.map((t) => (
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
          <BlockHeading>What the job involves</BlockHeading>
          <Html
            className="soc-prose"
            html={`<ul>${r.items.map((i) => `<li>${i}</li>`).join("")}</ul>`}
          />
        </div>

        <div className="space-y-2">
          <BlockHeading>What the interview tests</BlockHeading>
          <Html className="soc-prose" html={`<p>${r.probe}</p>`} />
        </div>

        <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
          <span className="mono-label mb-1.5 block text-accent-strong">
            What separates a strong candidate
          </span>
          <Html className="soc-prose" html={r.signal} />
        </div>
      </div>
    </article>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-hairline px-4 py-6 text-center font-mono text-[12px] text-muted-2">
      {children}
    </p>
  );
}
