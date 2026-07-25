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
  ATTACK_PATHS,
  CERT_NAMES,
  FUNDAMENTALS,
  PLAYBOOKS,
  PROVIDER_NAMES,
  PROVIDER_ORDER,
  SCENARIOS,
  TACTICS,
  TIER_NAMES,
  type AttackPath,
  type Cert,
  type Fundamental,
  type Playbook,
  type Provider,
  type Role,
  type Scenario,
  type Severity,
  type Tactic,
  type Tier,
} from "@/lib/cloud-prep/data";
import type { CloudPathModule, CloudPathRef } from "@/lib/cloud-prep/path";
import type { CloudProject } from "@/lib/cloud-prep/projects";
import { ListenButton, plainText } from "@/components/soc-prep/speech";

const TIER_TINT: Record<Tier, string> = {
  associate: "bg-(--cloud-associate)/15 text-(--cloud-associate)",
  engineer: "bg-(--cloud-engineer)/15 text-(--cloud-engineer)",
  architect: "bg-(--cloud-architect)/15 text-(--cloud-architect)",
};
const TIER_SOLID: Record<Tier, string> = {
  associate: "bg-(--cloud-associate)",
  engineer: "bg-(--cloud-engineer)",
  architect: "bg-(--cloud-architect)",
};
const PROVIDER_TINT: Record<Provider, string> = {
  aws: "bg-(--cloud-aws)/15 text-(--cloud-aws)",
  azure: "bg-(--cloud-azure)/15 text-(--cloud-azure)",
  gcp: "bg-(--cloud-gcp)/15 text-(--cloud-gcp)",
};
const PROVIDER_DOT: Record<Provider, string> = {
  aws: "bg-(--cloud-aws)",
  azure: "bg-(--cloud-azure)",
  gcp: "bg-(--cloud-gcp)",
};

const chip =
  "rounded-pill border-transparent px-2 font-mono text-[9.5px] font-bold tracking-[0.1em]";

export function TierBadge({ tier }: { tier: Tier }) {
  return <Badge className={cn(chip, TIER_TINT[tier])}>{TIER_NAMES[tier].toUpperCase()}</Badge>;
}

export function ProviderBadge({ provider }: { provider: Provider }) {
  return <Badge className={cn(chip, PROVIDER_TINT[provider])}>{PROVIDER_NAMES[provider]}</Badge>;
}

export function CertTags({ certs }: { certs: Cert[] }) {
  if (!certs.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {certs.map((c) => (
        <span
          key={c}
          className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-muted-2"
        >
          {CERT_NAMES[c]}
        </span>
      ))}
    </div>
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

/** Which provider blocks to show given the active provider filter. */
function shownProviders(f: Fundamental, filter: Provider | "all"): Provider[] {
  const available = PROVIDER_ORDER.filter((p) => f.providers[p]);
  if (filter === "all") return available;
  return available.filter((p) => p === filter);
}

function fundamentalReadText(f: Fundamental, providers: Provider[]): string {
  return [
    f.title,
    "The concept. " + plainText(f.concept),
    ...providers.map((p) => `On ${PROVIDER_NAMES[p]}. ` + plainText(f.providers[p] ?? "")),
  ]
    .filter(Boolean)
    .join(". ");
}

export function FundamentalCard({
  fundamental: f,
  index,
  providerFilter,
}: {
  fundamental: Fundamental;
  index: number;
  providerFilter: Provider | "all";
}) {
  const providers = shownProviders(f, providerFilter);
  return (
    <AccordionItem value={`cf-${index}`} id={`item-cf-${index}`} className={itemClass}>
      <AccordionTrigger className={cn(triggerClass, "py-3.5")}>
        <TierBadge tier={f.tier} />
        <span className="order-last w-full text-[14.5px] font-medium tracking-[-0.01em] text-ink sm:order-none sm:w-auto sm:flex-1">
          {f.title}
        </span>
        <span className="mono-label hidden text-faint lg:inline">{f.category}</span>
      </AccordionTrigger>
      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex items-center justify-between gap-2">
          <CertTags certs={f.certs} />
          <ListenButton
            id={`cf-${index}`}
            title={f.title}
            kind="Cloud fundamental"
            getText={() => fundamentalReadText(f, providers)}
          />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <BlockHeading>Concept</BlockHeading>
            <Html className="soc-prose" html={f.concept} />
          </div>

          {providers.map((p) => (
            <div key={p} className="space-y-2">
              <div className="mono-label flex items-center gap-2 text-muted-2">
                <span aria-hidden className={cn("size-2 rounded-full", PROVIDER_DOT[p])} />
                {PROVIDER_NAMES[p]}
              </div>
              <Html className="soc-prose" html={f.providers[p] ?? ""} />
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

const SEVERITY_TINT: Record<Severity, string> = {
  high: "bg-destructive/10 text-destructive",
  med: "bg-(--soc-l1)/15 text-(--soc-l1)",
  low: "bg-accent/15 text-accent-strong",
};
const SEVERITY_LABEL: Record<Severity, string> = { high: "HIGH", med: "MED", low: "LOW" };

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge className={cn(chip, SEVERITY_TINT[severity])}>{SEVERITY_LABEL[severity]}</Badge>;
}

function scenarioReadText(s: Scenario): string {
  return [
    s.title,
    "In plain English. " + plainText(s.plain),
    "The situation. " + plainText(s.situation),
    "The task. " + plainText(s.task),
    "Actions taken. " + s.actions.map(plainText).join(". "),
    "The result. " + plainText(s.result),
    "Lessons learned. " + s.lessons.map(plainText).join(". "),
    "A likely follow-up question. " + plainText(s.followUp),
  ].join(". ");
}

export function ScenarioCard({ scenario: s, open }: { scenario: Scenario; open: boolean }) {
  return (
    <AccordionItem value={`cs-${s.id}`} id={`item-cs-${s.id}`} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <span className="w-6 shrink-0 font-mono text-[11px] font-bold text-faint" aria-hidden>
          {String(s.id).padStart(2, "0")}
        </span>
        <SeverityBadge severity={s.severity} />
        <ProviderBadge provider={s.provider} />
        <span className="order-last w-full text-[14.5px] font-medium tracking-[-0.01em] text-ink sm:order-none sm:w-auto sm:flex-1">
          {s.title}
        </span>
        <span className="mono-label hidden text-faint xl:inline">{s.category}</span>
        <TierBadge tier={s.tier} />
      </AccordionTrigger>

      {!open && (
        <p className="soc-noprint -mt-1 max-w-(--soc-measure) px-4 pb-3.5 text-[13px] leading-normal text-muted-2 sm:px-5 sm:pl-14">
          <span className="mono-label mr-1.5 text-accent-strong">TL;DR</span>
          {s.task}
        </p>
      )}

      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex items-center justify-between gap-2">
          <CertTags certs={s.certs} />
          <ListenButton
            id={`cs-${s.id}`}
            title={s.title}
            kind="Cloud scenario"
            getText={() => scenarioReadText(s)}
          />
        </div>

        <div className="space-y-5">
          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
            <span className="mono-label mb-1.5 block text-accent-strong">In plain English</span>
            <Html className="soc-prose" html={s.plain} />
          </div>

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
            <span className="mono-label mb-1.5 block text-accent-strong">Likely follow-up</span>
            <Html
              className="text-[15px] font-medium leading-relaxed text-ink"
              html={`“${s.followUp}”`}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ---------------- Deep dive 1: attack paths ---------------- */

export function AttackPathCard({
  path: a,
  providerFilter,
}: {
  path: AttackPath;
  providerFilter: Provider | "all";
}) {
  const providers = PROVIDER_ORDER.filter(
    (p) => a.providers[p] && (providerFilter === "all" || p === providerFilter)
  );
  return (
    <AccordionItem value={`ap-${a.id}`} id={`item-ap-${a.id}`} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <span className="w-6 shrink-0 font-mono text-[11px] font-bold text-faint" aria-hidden>
          {String(a.id).padStart(2, "0")}
        </span>
        <span className="order-last w-full text-[14.5px] font-medium tracking-[-0.01em] text-ink sm:order-none sm:w-auto sm:flex-1">
          {a.title}
        </span>
        <span className="mono-label hidden text-faint lg:inline">{a.category}</span>
        <TierBadge tier={a.tier} />
      </AccordionTrigger>
      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex items-center justify-between gap-2">
          <CertTags certs={a.certs} />
          <ListenButton
            id={`ap-${a.id}`}
            title={a.title}
            kind="Cloud attack path"
            getText={() =>
              [
                a.title,
                "How the attack works. " + plainText(a.how),
                "The misconfiguration that enables it. " + plainText(a.enabler),
                "How to detect it. " + plainText(a.detect),
                "How to prevent it. " + plainText(a.fix),
              ].join(". ")
            }
          />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <BlockHeading>How the attack works</BlockHeading>
            <Html className="soc-prose" html={a.how} />
          </div>
          <div className="space-y-2">
            <BlockHeading>The misconfiguration that enables it</BlockHeading>
            <Html className="soc-prose" html={a.enabler} />
          </div>
          <div className="space-y-2">
            <BlockHeading>How to detect it</BlockHeading>
            <Html className="soc-prose" html={a.detect} />
          </div>
          <div className="space-y-2">
            <BlockHeading>How to prevent it</BlockHeading>
            <Html className="soc-prose" html={a.fix} />
          </div>

          {providers.map((p) => (
            <div key={p} className="space-y-2">
              <div className="mono-label flex items-center gap-2 text-muted-2">
                <span aria-hidden className={cn("size-2 rounded-full", PROVIDER_DOT[p])} />
                {PROVIDER_NAMES[p]}
              </div>
              <Html className="soc-prose" html={a.providers[p] ?? ""} />
            </div>
          ))}

          {a.attack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {a.attack.map((t) => (
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
      </AccordionContent>
    </AccordionItem>
  );
}

/* ---------------- Deep dive 2: ATT&CK tactics ---------------- */

export function TacticCard({ tactic: t }: { tactic: Tactic }) {
  return (
    <AccordionItem value={`ta-${t.id}`} id={`item-ta-${t.id}`} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <span className="shrink-0 font-mono text-[10.5px] font-bold text-accent-strong" aria-hidden>
          {t.id}
        </span>
        <span className="order-last w-full text-[14.5px] font-medium tracking-[-0.01em] text-ink sm:order-none sm:w-auto sm:flex-1">
          {t.name}
        </span>
        <span className="mono-label hidden text-faint lg:inline">
          {t.techniques.length} techniques
        </span>
      </AccordionTrigger>
      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex items-center justify-end">
          <ListenButton
            id={`ta-${t.id}`}
            title={`${t.name} tactic`}
            kind="ATT&CK tactic"
            getText={() =>
              [
                `${t.name}. ${t.goal}`,
                ...t.techniques.map(
                  (k) => `${k.name}. In the cloud: ${k.cloud} Detection: ${k.detect}`
                ),
              ].join(" ")
            }
          />
        </div>
        <p className="soc-prose mb-4">{t.goal}</p>
        <div className="space-y-3">
          {t.techniques.map((k) => (
            <div key={k.id + k.name} className="rounded-md border border-hairline p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[9.5px] text-accent-strong">
                  {k.id}
                </span>
                <span className="text-[14px] font-medium text-ink">{k.name}</span>
              </div>
              <p className="soc-prose mt-2">{k.cloud}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-2">
                <span className="mono-label mr-1.5 text-accent-strong">DETECT</span>
                {k.detect}
              </p>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ---------------- Deep dive 3: hardening playbooks ---------------- */

export function PlaybookCard({
  playbook: p,
  providerFilter,
}: {
  playbook: Playbook;
  providerFilter: Provider | "all";
}) {
  const providers = PROVIDER_ORDER.filter(
    (x) => p.providers[x] && (providerFilter === "all" || x === providerFilter)
  );
  return (
    <AccordionItem value={`pb-${p.id}`} id={`item-pb-${p.id}`} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <span className="order-last w-full text-[14.5px] font-medium tracking-[-0.01em] text-ink sm:order-none sm:w-auto sm:flex-1">
          {p.domain}
        </span>
        <span className="mono-label hidden text-faint lg:inline">
          {p.checklist.length} controls
        </span>
        <TierBadge tier={p.tier} />
      </AccordionTrigger>
      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex items-center justify-between gap-2">
          <CertTags certs={p.certs} />
          <ListenButton
            id={`pb-${p.id}`}
            title={`${p.domain} hardening playbook`}
            kind="Hardening playbook"
            getText={() =>
              [`${p.domain} hardening. Goal: ${p.goal}`, ...p.checklist.map(plainText)].join(". ")
            }
          />
        </div>

        <div className="space-y-5">
          <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5">
            <span className="mono-label mb-1.5 block text-accent-strong">Goal</span>
            <p className="soc-prose">{p.goal}</p>
          </div>

          <div className="space-y-2">
            <BlockHeading>Checklist</BlockHeading>
            <ul className="space-y-2.5">
              {p.checklist.map((c, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 font-mono text-[11px] text-accent-strong"
                  >
                    ☐
                  </span>
                  <Html className="soc-prose flex-1" html={c} />
                </li>
              ))}
            </ul>
          </div>

          {providers.map((x) => (
            <div key={x} className="space-y-2">
              <div className="mono-label flex items-center gap-2 text-muted-2">
                <span aria-hidden className={cn("size-2 rounded-full", PROVIDER_DOT[x])} />
                {PROVIDER_NAMES[x]}
              </div>
              <Html className="soc-prose" html={p.providers[x] ?? ""} />
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function RoleCard({ role: r }: { role: Role }) {
  return (
    <article className="rounded-lg border-[1.5px] border-hairline bg-surface p-5 sm:p-6">
      <Badge className={cn(chip, "mb-3 text-paper", TIER_SOLID[r.tier])}>
        {TIER_NAMES[r.tier].toUpperCase()}
      </Badge>
      <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">{r.title}</h3>
      <p className="mono-label mt-0.5 mb-4 text-muted-2">{r.range}</p>
      <Html
        className="soc-prose"
        html={`<ol class="soc-steps">${r.items.map((i) => `<li>${i}</li>`).join("")}</ol>`}
      />
      <p className="mono-label mt-4 border-t border-divider pt-3 text-faint">{r.kpi}</p>
    </article>
  );
}

/* ---------------- Learning path ---------------- */

const CLOUD_REF_LABEL: Record<CloudPathRef["kind"], string> = {
  cf: "Fundamental",
  cs: "Scenario",
  ap: "Attack path",
  pb: "Playbook",
  ta: "Tactic",
};

/** Full content of a referenced cloud card, rendered inline in a module. */
function CloudRefContent({
  refItem,
  providerFilter,
}: {
  refItem: CloudPathRef;
  providerFilter: Provider | "all";
}) {
  const shown = (avail: Partial<Record<Provider, string>>) =>
    PROVIDER_ORDER.filter((p) => avail[p] && (providerFilter === "all" || p === providerFilter));

  const providerBlocks = (avail: Partial<Record<Provider, string>>) =>
    shown(avail).map((p) => (
      <div key={p} className="space-y-1.5">
        <div className="mono-label flex items-center gap-2 text-muted-2">
          <span aria-hidden className={cn("size-2 rounded-full", PROVIDER_DOT[p])} />
          {PROVIDER_NAMES[p]}
        </div>
        <Html className="soc-prose" html={avail[p] ?? ""} />
      </div>
    ));

  if (refItem.kind === "cf") {
    const f = FUNDAMENTALS[Number(refItem.id)];
    if (!f) return null;
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <BlockHeading>Concept</BlockHeading>
          <Html className="soc-prose" html={f.concept} />
        </div>
        {providerBlocks(f.providers)}
      </div>
    );
  }

  if (refItem.kind === "cs") {
    const s = SCENARIOS.find((x) => x.id === Number(refItem.id));
    if (!s) return null;
    return (
      <div className="space-y-4">
        <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3">
          <span className="mono-label mb-1 block text-accent-strong">In plain English</span>
          <Html className="soc-prose" html={s.plain} />
        </div>
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
            html={`<ul>${s.lessons.map((l) => `<li>${l}</li>`).join("")}</ul>`}
          />
        </div>
        <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3">
          <span className="mono-label mb-1 block text-accent-strong">Likely follow-up</span>
          <p className="text-[15px] font-medium leading-relaxed text-ink">“{s.followUp}”</p>
        </div>
      </div>
    );
  }

  if (refItem.kind === "ap") {
    const a = ATTACK_PATHS.find((x) => x.id === Number(refItem.id));
    if (!a) return null;
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <BlockHeading>How the attack works</BlockHeading>
          <Html className="soc-prose" html={a.how} />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>The misconfiguration that enables it</BlockHeading>
          <Html className="soc-prose" html={a.enabler} />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>How to detect it</BlockHeading>
          <Html className="soc-prose" html={a.detect} />
        </div>
        <div className="space-y-1.5">
          <BlockHeading>How to prevent it</BlockHeading>
          <Html className="soc-prose" html={a.fix} />
        </div>
        {providerBlocks(a.providers)}
      </div>
    );
  }

  if (refItem.kind === "pb") {
    const p = PLAYBOOKS.find((x) => x.id === String(refItem.id));
    if (!p) return null;
    return (
      <div className="space-y-4">
        <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3">
          <span className="mono-label mb-1 block text-accent-strong">Goal</span>
          <p className="soc-prose">{p.goal}</p>
        </div>
        <div className="space-y-1.5">
          <BlockHeading>Checklist</BlockHeading>
          <ul className="space-y-2">
            {p.checklist.map((c, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-0.5 shrink-0 font-mono text-[11px] text-accent-strong">
                  ☐
                </span>
                <Html className="soc-prose flex-1" html={c} />
              </li>
            ))}
          </ul>
        </div>
        {providerBlocks(p.providers)}
      </div>
    );
  }

  const t = TACTICS.find((x) => x.id === String(refItem.id));
  if (!t) return null;
  return (
    <div className="space-y-3">
      <p className="soc-prose">{t.goal}</p>
      {t.techniques.map((k) => (
        <div key={k.id + k.name} className="rounded-md border border-hairline p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[9.5px] text-accent-strong">
              {k.id}
            </span>
            <span className="text-[14px] font-medium text-ink">{k.name}</span>
          </div>
          <p className="soc-prose mt-1.5">{k.cloud}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-2">
            <span className="mono-label mr-1.5 text-accent-strong">DETECT</span>
            {k.detect}
          </p>
        </div>
      ))}
    </div>
  );
}

/** One numbered step — expands its content in place. */
function CloudRefStep({
  refItem,
  index,
  providerFilter,
  onGoTo,
}: {
  refItem: CloudPathRef;
  index: number;
  providerFilter: Provider | "all";
  onGoTo: (ref: CloudPathRef) => void;
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
          {CLOUD_REF_LABEL[refItem.kind]}
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
          <CloudRefContent refItem={refItem} providerFilter={providerFilter} />
          <button
            type="button"
            onClick={() => onGoTo(refItem)}
            className="mono-label soc-noprint mt-4 text-faint transition-colors hover:text-ink"
          >
            open in {CLOUD_REF_LABEL[refItem.kind].toLowerCase()} section ↗
          </button>
        </div>
      )}
    </li>
  );
}

export function CloudPathModuleCard({
  module: m,
  done,
  providerFilter,
  onToggleDone,
  onGoTo,
}: {
  module: CloudPathModule;
  done: boolean;
  providerFilter: Provider | "all";
  onToggleDone: () => void;
  onGoTo: (ref: CloudPathRef) => void;
}) {
  return (
    <AccordionItem value={`cpm-${m.id}`} id={`item-cpm-${m.id}`} className={itemClass}>
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
            id={`cpm-${m.id}`}
            title={m.title}
            kind="Cloud study module"
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
                  <CloudRefStep
                    key={`${r.kind}-${r.id}`}
                    refItem={r}
                    index={i}
                    providerFilter={providerFilter}
                    onGoTo={onGoTo}
                  />
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

export function CloudProjectCard({
  project: p,
  built,
  onToggleBuilt,
}: {
  project: CloudProject;
  built: boolean;
  onToggleBuilt: () => void;
}) {
  return (
    <AccordionItem value={`cpj-${p.id}`} id={`item-cpj-${p.id}`} className={itemClass}>
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
        <TierBadge tier={p.tier} />
      </AccordionTrigger>

      <AccordionContent forceMount className={contentClass}>
        <div className="soc-noprint mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-pill border border-hairline px-2 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-muted-2">
              {p.category.toUpperCase()}
            </span>
            <span className="rounded-pill border border-hairline px-2 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-muted-2">
              {p.hours}
            </span>
            {p.providers.map((x) => (
              <ProviderBadge key={x} provider={x} />
            ))}
          </div>
          <ListenButton
            id={`cpj-${p.id}`}
            title={p.title}
            kind="Cloud project"
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

          {/* Cloud costs real money — make the note impossible to miss. */}
          <p className="mono-label rounded-md border border-(--soc-l1) bg-(--soc-l1)/10 px-3 py-2 text-(--soc-l1)">
            COST — {p.cost.replace(/<\/?b>/g, "")}
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

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-hairline py-8 text-center font-mono text-xs text-muted-2">
      {children}
    </p>
  );
}

export { Button };
