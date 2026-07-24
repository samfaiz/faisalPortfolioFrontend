"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CLOUD_MCQS, type CloudMCQ } from "@/lib/cloud-prep/mcq";
import { PROVIDER_NAMES, type Cert, type Provider, type Tier } from "@/lib/cloud-prep/data";
import { ListenButton, plainText, speech } from "@/components/soc-prep/speech";
import { ProviderBadge, TierBadge } from "./parts";

const LETTERS = ["A", "B", "C", "D", "E"];
const QUIZ_CATS = [...new Set(CLOUD_MCQS.map((q) => q.category))];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pillClass = (active: boolean) =>
  cn(
    "mono-label rounded-pill border-[1.5px] px-3 py-1.5 transition-colors",
    active
      ? "border-ink bg-ink text-paper"
      : "border-hairline text-muted-2 hover:border-ink hover:text-ink"
  );

type Phase = "config" | "active" | "done";

export function CloudQuiz({
  tier,
  provider,
  cert,
}: {
  tier: "all" | Tier;
  provider: "all" | Provider;
  cert: "all" | Cert;
}) {
  const [cat, setCat] = useState("all");
  const [shuffle, setShuffle] = useState(true);
  const [phase, setPhase] = useState<Phase>("config");
  const [deck, setDeck] = useState<CloudMCQ[]>([]);
  const [current, setCurrent] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(
    () =>
      CLOUD_MCQS.filter(
        (q) =>
          (tier === "all" || q.tier === tier) &&
          (cert === "all" || q.certs.includes(cert)) &&
          (provider === "all" || !q.provider || q.provider === provider) &&
          (cat === "all" || q.category === cat)
      ),
    [tier, cert, provider, cat]
  );

  const catCounts = useMemo(
    () =>
      Object.fromEntries(
        QUIZ_CATS.map((c) => [
          c,
          CLOUD_MCQS.filter(
            (q) =>
              q.category === c &&
              (tier === "all" || q.tier === tier) &&
              (cert === "all" || q.certs.includes(cert)) &&
              (provider === "all" || !q.provider || q.provider === provider)
          ).length,
        ])
      ),
    [tier, cert, provider]
  );

  const begin = useCallback(
    (questions: CloudMCQ[]) => {
      speech.stop();
      setDeck(shuffle ? shuffled(questions) : questions);
      setCurrent(0);
      setPicks({});
      setPhase("active");
    },
    [shuffle]
  );

  const q = deck[current];
  const answered = q ? picks[q.id] !== undefined : false;
  const score = deck.reduce((n, d) => n + (picks[d.id] === d.answer ? 1 : 0), 0);
  const isLast = current === deck.length - 1;

  const pick = useCallback(
    (i: number) => {
      if (!q || picks[q.id] !== undefined) return;
      setPicks((p) => ({ ...p, [q.id]: i }));
    },
    [q, picks]
  );

  const next = useCallback(() => {
    speech.stop();
    if (isLast) {
      setPhase("done");
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setCurrent((c) => c + 1);
    }
  }, [isLast]);

  useEffect(() => {
    if (phase !== "active") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (!q) return;
      const num = Number(e.key);
      if (num >= 1 && num <= q.options.length) return pick(num - 1);
      const letter = LETTERS.indexOf(e.key.toUpperCase());
      if (letter >= 0 && letter < q.options.length) return pick(letter);
      if ((e.key === "Enter" || e.key === "ArrowRight") && picks[q.id] !== undefined) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, q, picks, pick, next]);

  /* ----------------------------- CONFIG ----------------------------- */
  if (phase === "config") {
    return (
      <div ref={cardRef} className="soc-card rounded-lg border-[1.5px] border-ink bg-surface p-5 sm:p-7">
        <p className="soc-prose max-w-(--soc-measure)">
          Multiple-choice drill across every domain, cloud, and seniority level. It respects the{" "}
          <b>tier, provider, and cert filters</b> above — so you can drill only AZ-500 Engineer
          questions if that is your exam.
        </p>

        <div className="mt-5">
          <span className="mono-label mb-2 block text-muted-2">Topic</span>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={pillClass(cat === "all")} onClick={() => setCat("all")}>
              ALL {pool.length}
            </button>
            {QUIZ_CATS.filter((c) => catCounts[c] > 0).map((c) => (
              <button key={c} type="button" className={pillClass(cat === c)} onClick={() => setCat(c)}>
                {c.toUpperCase()} {catCounts[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={shuffle}
            onClick={() => setShuffle((v) => !v)}
            className={cn(
              "mono-label inline-flex items-center gap-2 rounded-pill border-[1.5px] px-3 py-1.5 transition-colors",
              shuffle ? "border-accent text-accent-strong" : "border-hairline text-muted-2"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-4 place-items-center rounded-full border-[1.5px]",
                shuffle ? "border-accent bg-accent text-paper" : "border-faint"
              )}
            >
              {shuffle ? "✓" : ""}
            </span>
            SHUFFLE
          </button>

          <Button
            onClick={() => begin(pool)}
            disabled={pool.length === 0}
            className="mono-label rounded-pill bg-accent px-5 py-2.5 font-semibold text-paper hover:bg-accent/90"
          >
            START {pool.length} QUESTION{pool.length === 1 ? "" : "S"} →
          </Button>
        </div>

        {pool.length === 0 && (
          <p className="mono-label mt-4 text-muted-2">
            No questions for this filter — widen the tier, provider, or cert.
          </p>
        )}
      </div>
    );
  }

  /* ----------------------------- DONE ------------------------------- */
  if (phase === "done") {
    const pct = deck.length ? Math.round((score / deck.length) * 100) : 0;
    const wrong = deck.filter((d) => picks[d.id] !== d.answer);
    const verdict = pct >= 90 ? "Interview-ready." : pct >= 70 ? "Solid — tighten the misses." : "Keep drilling.";
    const byCat = QUIZ_CATS.map((c) => {
      const items = deck.filter((d) => d.category === c);
      if (!items.length) return null;
      return { c, got: items.filter((d) => picks[d.id] === d.answer).length, total: items.length };
    }).filter(Boolean) as { c: string; got: number; total: number }[];

    return (
      <div ref={cardRef} className="soc-card rounded-lg border-[1.5px] border-ink bg-surface p-5 sm:p-7">
        <span className="mono-label text-accent-strong">Result</span>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-display text-[clamp(2.5rem,8vw,4rem)] font-bold leading-none tracking-[-0.04em]">
            {score}
            <span className="text-faint">/{deck.length}</span>
          </span>
          <span className="font-display text-2xl font-semibold text-accent-strong">{pct}%</span>
          <span className="mono-label text-muted-2">{verdict}</span>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {byCat.map((b) => (
            <div
              key={b.c}
              className="flex items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2"
            >
              <span className="mono-label text-muted-2">{b.c}</span>
              <span
                className={cn(
                  "font-mono text-sm font-semibold",
                  b.got === b.total ? "text-accent-strong" : "text-ink"
                )}
              >
                {b.got}/{b.total}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            onClick={() => begin(pool)}
            className="mono-label rounded-pill bg-ink px-5 py-2.5 font-semibold text-paper hover:bg-ink/90"
          >
            RESTART
          </Button>
          {wrong.length > 0 && (
            <Button
              variant="outline"
              onClick={() => begin(wrong)}
              className="mono-label rounded-pill border-[1.5px] px-5 py-2.5"
            >
              PRACTISE THE {wrong.length} I MISSED →
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------- ACTIVE ------------------------------ */
  const progressPct = deck.length ? ((current + (answered ? 1 : 0)) / deck.length) * 100 : 0;

  return (
    <div ref={cardRef} className="soc-card rounded-lg border-[1.5px] border-ink bg-surface p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="mono-label text-muted-2">
          Question {current + 1} / {deck.length}
        </span>
        <span className="mono-label text-accent-strong">✓ {score}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface-alt">
        <div
          className="h-full rounded-pill bg-accent transition-[width] duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <TierBadge tier={q.tier} />
        {q.provider && <ProviderBadge provider={q.provider} />}
        <span className="mono-label text-faint">{q.category}</span>
        <ListenButton
          id={`cq-${q.id}`}
          title={q.question}
          kind="Cloud quiz question"
          className="ml-auto"
          getText={() => {
            const base =
              q.question + ". Options: " + q.options.map((o, i) => `${LETTERS[i]}. ${o}`).join(". ");
            return answered
              ? `${base}. The correct answer is ${LETTERS[q.answer]}. ${plainText(q.explanation)}`
              : base;
          }}
        />
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-[-0.01em] sm:text-xl">
        {q.question}
      </h3>

      <div className="mt-5 grid gap-2.5" role="group" aria-label="Answer options">
        {q.options.map((opt, i) => {
          const chosen = picks[q.id] === i;
          const correct = i === q.answer;
          const showCorrect = answered && correct;
          const showWrong = answered && chosen && !correct;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => pick(i)}
              aria-pressed={chosen}
              className={cn(
                "flex items-start gap-3 rounded-md border-[1.5px] px-4 py-3 text-left text-[15px] transition-colors",
                !answered && "border-hairline hover:border-ink hover:bg-surface-alt/60",
                showCorrect && "border-accent bg-accent/10",
                showWrong && "border-destructive bg-destructive/10",
                answered && !showCorrect && !showWrong && "border-hairline opacity-55"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-px grid size-6 shrink-0 place-items-center rounded-md font-mono text-xs font-bold",
                  showCorrect && "bg-accent text-paper",
                  showWrong && "bg-destructive text-paper",
                  !showCorrect && !showWrong && "bg-surface-alt text-muted-2"
                )}
              >
                {showCorrect ? "✓" : showWrong ? "✕" : LETTERS[i]}
              </span>
              <span className={cn("flex-1", chosen || showCorrect ? "text-ink" : "text-muted")}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          aria-live="polite"
          className="mt-5 max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-4 py-3.5"
        >
          <span className="mono-label mb-1.5 block text-accent-strong">
            {picks[q.id] === q.answer ? "✓ Correct" : `Correct answer: ${LETTERS[q.answer]}`}
          </span>
          <div className="soc-prose" dangerouslySetInnerHTML={{ __html: q.explanation }} />
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            speech.stop();
            setPhase("config");
          }}
          className="mono-label text-muted-2 transition-colors hover:text-ink"
        >
          ← Exit
        </button>
        {answered ? (
          <Button
            onClick={next}
            className="mono-label rounded-pill bg-ink px-5 py-2.5 font-semibold text-paper hover:bg-ink/90"
          >
            {isLast ? "SEE RESULTS →" : "NEXT →"}
          </Button>
        ) : (
          <span className="mono-label hidden text-faint sm:block">
            Pick an answer — or press 1–{q.options.length}
          </span>
        )}
      </div>

      {provider !== "all" && (
        <p className="mono-label mt-3 text-faint">
          Showing {PROVIDER_NAMES[provider]} + cloud-agnostic questions
        </p>
      )}
    </div>
  );
}
