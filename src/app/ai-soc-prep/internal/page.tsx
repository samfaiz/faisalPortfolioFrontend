import Link from "next/link";
import type { Metadata } from "next";
import { UnlockForm } from "@/components/ai-soc-prep/unlock-form";
import { hasInternalAccess, internalAuthConfigured } from "@/lib/internal-auth";
import { MODULES_WITH_ANNEX } from "@/lib/ai-soc-prep/data";
import { lock } from "./actions";

// Never prerender. A static build of this page would exist on disk as HTML and
// could be served without the cookie ever being checked.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal annexes",
  // The gate keeps it off the public web; this keeps it out of search results
  // even if a URL leaks.
  robots: { index: false, follow: false },
};

export default async function InternalIndexPage() {
  const unlocked = await hasInternalAccess();

  return (
    <div className="soc-page min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-225 px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        <Link
          href="/ai-soc-prep"
          className="mono-label inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
        >
          ← BACK TO AI SOC ANALYST
        </Link>

        <header className="mt-6 border-b-2 border-ink pb-7">
          <span className="mono-label text-(--ai-review)">INTERNAL</span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Internal annexes
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            Environment-specific notes that sit alongside the public modules —
            our stack, our thresholds, our data classification. Not published.
          </p>
        </header>

        {!unlocked ? (
          <section className="mt-10">
            <p className="max-w-(--soc-measure) font-mono text-[12.5px] leading-relaxed text-muted-2">
              {
                "// Shared password. This keeps internal notes off the public web — it is not per-user auth, so nothing here should be anything whose disclosure would be an incident."
              }
            </p>
            <UnlockForm />
            {!internalAuthConfigured() && (
              <p className="mt-4 max-w-sm rounded-md border border-(--ai-review) bg-(--ai-review)/10 px-3 py-2 font-mono text-[12px] text-(--ai-review)">
                Not configured on this deployment. Set INTERNAL_ANNEX_PASSWORD
                (and ideally INTERNAL_ANNEX_SECRET) and rebuild.
              </p>
            )}
          </section>
        ) : (
          <section className="mt-10">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="mono-label rounded-pill border border-(--ai-verified) px-2.5 py-1 text-(--ai-verified)">
                ✓ UNLOCKED
              </span>
              <form action={lock}>
                <button
                  type="submit"
                  className="mono-label rounded-pill border-[1.5px] border-hairline px-3 py-1 text-muted-2 transition-colors hover:border-ink hover:text-ink"
                >
                  LOCK
                </button>
              </form>
            </div>

            <ul className="space-y-2">
              {MODULES_WITH_ANNEX.map((m) => (
                <li key={m.n}>
                  <Link
                    href={`/ai-soc-prep/internal/${m.slug}`}
                    className="flex items-center justify-between gap-3 rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
                  >
                    <span>
                      <span className="mono-label block text-faint">
                        MODULE {String(m.n).padStart(2, "0")} · {m.annex!.length}{" "}
                        NOTE{m.annex!.length === 1 ? "" : "S"}
                      </span>
                      <span className="mt-0.5 block text-[14.5px] font-medium text-ink">
                        {m.title}
                      </span>
                    </span>
                    <span aria-hidden className="font-mono text-[16px] text-faint">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
