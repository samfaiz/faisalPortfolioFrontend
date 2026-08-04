import Link from "next/link";
import type { Metadata } from "next";
import { AiSocQuiz } from "@/components/ai-soc-prep/quiz";
import {
  MODULE_QUIZ_COUNT,
  FINAL_EXAM_COUNT,
} from "@/lib/ai-soc-prep/quiz";

const total = MODULE_QUIZ_COUNT + FINAL_EXAM_COUNT;
const title = "Quiz — AI SOC Analyst";
const description = `${total} questions — 8 per module across all 14 modules, plus a ${FINAL_EXAM_COUNT}-question final exam gated behind them. Every question is answerable from its module page, and every answer teaches.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/quiz" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function AiSocQuizPage() {
  return (
    <div className="soc-page min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-225 px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        <Link
          href="/ai-soc-prep"
          className="mono-label soc-noprint inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
        >
          ← BACK TO AI SOC ANALYST
        </Link>

        <header className="mt-6 border-b-2 border-ink pb-7">
          <span className="mono-label text-accent-strong">
            {total} QUESTIONS · {MODULE_QUIZ_COUNT} MODULE + {FINAL_EXAM_COUNT} FINAL
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Quiz
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            Eight questions per module, answerable purely from the module page,
            with an explanation after every answer — correct or not — that{" "}
            <b className="font-medium text-ink">teaches</b> rather than confirms.
            Pass each module at 60%+ to unlock the final exam.
          </p>
          <p className="mt-3 max-w-(--soc-measure) font-mono text-[12.5px] leading-[1.7] text-muted-2">
            {
              "// Scenario and verification questions are where the learning happens. Recall is kept under a quarter on purpose. Scores are saved in this browser."
            }
          </p>
        </header>

        <div className="mt-10">
          <AiSocQuiz />
        </div>
      </div>
    </div>
  );
}
