"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AI_SOC_MCQS,
  type AiSocMCQ,
  mcqsForModule,
  finalExam,
  FINAL_EXAM_COUNT,
} from "@/lib/ai-soc-prep/quiz";
import { MODULES, moduleByNumber } from "@/lib/ai-soc-prep/data";

/**
 * The AI SOC quiz.
 *
 * Config → active → done, like the /soc-prep drill, with two additions the plan
 * requires: per-module best scores persisted to localStorage, and a final exam
 * gated behind every module quiz having been passed at ≥60%.
 *
 * The gate is the teaching point made mechanical — you cannot sit the final
 * until you have demonstrably worked through the modules.
 */

const LETTERS = ["A", "B", "C", "D", "E"];
const STORE_KEY = "ai-soc-prep:quiz-scores"; // { [moduleNumber]: bestPct }
const PASS_PCT = 60;

/** Modules that actually have a quiz (1–14). */
const QUIZ_MODULE_NUMS = MODULES.filter(
  (m) => mcqsForModule(m.n).length > 0
).map((m) => m.n);

type Phase = "config" | "active" | "done";
type Deck = { key: string; label: string; moduleN: number; questions: AiSocMCQ[] };

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AiSocQuiz() {
  const [scores, setScores] = useState<Record<number, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("config");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [order, setOrder] = useState<AiSocMCQ[]>([]);
  const [current, setCurrent] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
      if (raw && typeof raw === "object") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setScores(raw);
      }
    } catch {}
    setHydrated(true);
  }, []);

  const persist = (next: Record<number, number>) => {
    setScores(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {}
  };

  const passedCount = QUIZ_MODULE_NUMS.filter(
    (n) => (scores[n] ?? 0) >= PASS_PCT
  ).length;
  const finalUnlocked = passedCount === QUIZ_MODULE_NUMS.length;

  const begin = (d: Deck) => {
    setDeck(d);
    setOrder(shuffled(d.questions));
    setCurrent(0);
    setPicks({});
    setPhase("active");
  };

  const q = order[current];
  const answered = q ? picks[q.id] !== undefined : false;
  const score = order.reduce((n, d) => n + (picks[d.id] === d.answer ? 1 : 0), 0);
  const isLast = current === order.length - 1;

  const pick = (i: number) => {
    if (!q || picks[q.id] !== undefined) return;
    setPicks((p) => ({ ...p, [q.id]: i }));
  };

  const next = () => {
    if (isLast) {
      // Record best score for a module deck (not the final exam mixed deck).
      if (deck && deck.moduleN > 0) {
        const pct = order.length
          ? Math.round((score / order.length) * 100)
          : 0;
        const best = Math.max(scores[deck.moduleN] ?? 0, pct);
        if (best !== (scores[deck.moduleN] ?? 0)) {
          persist({ ...scores, [deck.moduleN]: best });
        }
      }
      setPhase("done");
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setCurrent((c) => c + 1);
    }
  };

  useEffect(() => {
    if (phase !== "active") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current, q, picks]);

  /* ------------------------------- CONFIG -------------------------------- */
  if (phase === "config") {
    return (
      <div ref={cardRef} className="space-y-8">
        {/* Progress toward the final */}
        <div className="rounded-lg border-[1.5px] border-ink bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="mono-label text-accent-strong">
              MODULE QUIZZES PASSED
            </span>
            <span className="font-display text-2xl font-bold">
              {hydrated ? passedCount : 0}
              <span className="text-faint">/{QUIZ_MODULE_NUMS.length}</span>
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-surface-alt">
            <div
              className="h-full rounded-pill bg-accent transition-[width] duration-500"
              style={{
                width: `${hydrated ? (passedCount / QUIZ_MODULE_NUMS.length) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="mt-3 font-mono text-[11.5px] leading-relaxed text-muted-2">
            {`// Pass each module quiz at ${PASS_PCT}% or better to unlock the ${FINAL_EXAM_COUNT}-question final exam.`}
          </p>
        </div>

        {/* Module deck grid */}
        <div>
          <span className="mono-label mb-3 block text-accent-strong">
            MODULE QUIZZES · 8 QUESTIONS EACH
          </span>
          <ul className="grid gap-2 sm:grid-cols-2">
            {QUIZ_MODULE_NUMS.map((n) => {
              const m = moduleByNumber(n)!;
              const best = scores[n];
              const passed = (best ?? 0) >= PASS_PCT;
              return (
                <li key={n}>
                  <button
                    type="button"
                    onClick={() =>
                      begin({
                        key: `m${n}`,
                        label: `Module ${n} — ${m.title}`,
                        moduleN: n,
                        questions: mcqsForModule(n),
                      })
                    }
                    className="group flex w-full items-center gap-3 rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3 text-left transition-colors hover:border-ink"
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-pill border-[1.5px] font-mono text-[11px] font-bold",
                        passed
                          ? "border-accent bg-accent text-paper"
                          : "border-hairline text-muted-2"
                      )}
                    >
                      {passed ? "✓" : String(n).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">
                        {m.title}
                      </span>
                      <span className="mono-label text-faint">
                        {hydrated && best !== undefined
                          ? `BEST ${best}%`
                          : "NOT ATTEMPTED"}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="mono-label text-accent-strong opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      START →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Final exam */}
        <div>
          <span className="mono-label mb-3 block text-accent-strong">
            FINAL EXAM · {FINAL_EXAM_COUNT} QUESTIONS · 70% TO PASS
          </span>
          <button
            type="button"
            disabled={!finalUnlocked}
            onClick={() =>
              begin({
                key: "final",
                label: "Final exam",
                moduleN: 0,
                questions: finalExam(),
              })
            }
            className={cn(
              "flex w-full items-center gap-4 rounded-lg border-[1.5px] px-5 py-5 text-left transition-colors",
              finalUnlocked
                ? "border-(--ai-verified) bg-(--ai-verified)/5 hover:bg-(--ai-verified)/10"
                : "cursor-not-allowed border-dashed border-hairline bg-surface-alt opacity-70"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-pill border-[1.5px] font-mono text-lg",
                finalUnlocked
                  ? "border-(--ai-verified) text-(--ai-verified)"
                  : "border-faint text-faint"
              )}
            >
              {finalUnlocked ? "✓" : "⌁"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-ink">
                {finalUnlocked
                  ? "Final exam unlocked — sit it now"
                  : "Final exam locked"}
              </span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-muted-2">
                {finalUnlocked
                  ? `${FINAL_EXAM_COUNT} mixed questions across all 14 modules. 70% to pass.`
                  : `Pass all ${QUIZ_MODULE_NUMS.length} module quizzes at ${PASS_PCT}%+ to unlock. ${
                      hydrated ? QUIZ_MODULE_NUMS.length - passedCount : QUIZ_MODULE_NUMS.length
                    } to go.`}
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------- DONE --------------------------------- */
  if (phase === "done" && deck) {
    const pct = order.length ? Math.round((score / order.length) * 100) : 0;
    const isFinal = deck.moduleN === 0;
    const threshold = isFinal ? 70 : PASS_PCT;
    const passed = pct >= threshold;
    const wrong = order.filter((d) => picks[d.id] !== d.answer);
    const m = deck.moduleN > 0 ? moduleByNumber(deck.moduleN) : null;

    return (
      <div
        ref={cardRef}
        className="rounded-lg border-[1.5px] border-ink bg-surface p-5 sm:p-7"
      >
        <span className="mono-label text-accent-strong">
          {deck.label} · RESULT
        </span>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-display text-[clamp(2.5rem,8vw,4rem)] font-bold leading-none tracking-[-0.04em]">
            {score}
            <span className="text-faint">/{order.length}</span>
          </span>
          <span
            className={cn(
              "font-display text-2xl font-semibold",
              passed ? "text-(--ai-verified)" : "text-(--ai-unverified)"
            )}
          >
            {pct}%
          </span>
          <span
            className={cn(
              "mono-label rounded-pill border-[1.5px] px-3 py-1",
              passed
                ? "border-(--ai-verified) text-(--ai-verified)"
                : "border-(--ai-unverified) text-(--ai-unverified)"
            )}
          >
            {passed ? `PASSED (≥${threshold}%)` : `NOT YET (${threshold}% TO PASS)`}
          </span>
        </div>

        {isFinal && passed && (
          <p className="soc-prose mt-4 max-w-(--soc-measure)">
            That is the path. You can describe AI as an evidence-processing layer
            a human stays accountable for — and prove it with a measured
            assistant. The capstone (project 10) is where you turn this into the
            one sentence that ends an interview in your favour.
          </p>
        )}
        {!passed && (
          <p className="soc-prose mt-4 max-w-(--soc-measure)">
            {m ? (
              <>
                Re-read{" "}
                <Link
                  href={`/ai-soc-prep/module/${m.slug}`}
                  className="underline hover:text-ink"
                >
                  module {deck.moduleN}
                </Link>{" "}
                and try again — the explanations above are the fastest way back.
              </>
            ) : (
              "Review the modules you scored lowest on, then re-sit."
            )}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            onClick={() => begin(deck)}
            className="mono-label rounded-pill bg-ink px-5 py-2.5 font-semibold text-paper hover:bg-ink/90"
          >
            RETRY
          </Button>
          {wrong.length > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                begin({ ...deck, questions: wrong })
              }
              className="mono-label rounded-pill border-[1.5px] px-5 py-2.5"
            >
              PRACTISE THE {wrong.length} I MISSED →
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setPhase("config")}
            className="mono-label rounded-pill border-[1.5px] px-5 py-2.5"
          >
            ← ALL QUIZZES
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------- ACTIVE -------------------------------- */
  if (!q || !deck) return null;
  const progressPct = order.length
    ? ((current + (answered ? 1 : 0)) / order.length) * 100
    : 0;

  return (
    <div
      ref={cardRef}
      className="rounded-lg border-[1.5px] border-ink bg-surface p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="mono-label text-muted-2">
          {deck.label} · {current + 1} / {order.length}
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
        <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-faint">
          {q.kind.toUpperCase()}
        </span>
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
                showCorrect && "border-(--ai-verified) bg-(--ai-verified)/10",
                showWrong && "border-destructive bg-destructive/10",
                answered && !showCorrect && !showWrong && "border-hairline opacity-55"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-px grid size-6 shrink-0 place-items-center rounded-md font-mono text-xs font-bold",
                  showCorrect && "bg-(--ai-verified) text-paper",
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
            {picks[q.id] === q.answer
              ? "✓ Correct"
              : `Correct answer: ${LETTERS[q.answer]}`}
          </span>
          <div
            className="soc-prose"
            dangerouslySetInnerHTML={{ __html: q.explanation }}
          />
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPhase("config")}
          className="mono-label text-muted-2 transition-colors hover:text-ink"
        >
          ← Exit
        </button>
        {answered ? (
          <Button
            onClick={next}
            className="mono-label rounded-pill bg-ink px-5 py-2.5 font-semibold text-paper hover:bg-ink/90"
          >
            {isLast ? "SEE RESULT →" : "NEXT →"}
          </Button>
        ) : (
          <span className="mono-label hidden text-faint sm:block">
            Pick an answer — or press 1–{q.options.length}
          </span>
        )}
      </div>
    </div>
  );
}

export { AI_SOC_MCQS };
