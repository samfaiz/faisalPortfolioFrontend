import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnlockForm } from "@/components/ai-soc-prep/unlock-form";
import { hasInternalAccess } from "@/lib/internal-auth";
import { moduleBySlug } from "@/lib/ai-soc-prep/data";

// Dynamic, always. The annex body must never be rendered into a static file —
// that file would sit on disk and be servable without the cookie being checked.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal annex",
  robots: { index: false, follow: false },
};

export default async function AnnexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = moduleBySlug(slug);
  if (!m || !m.annex?.length) notFound();

  const unlocked = await hasInternalAccess();

  return (
    <div className="soc-page min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-225 px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        <Link
          href="/ai-soc-prep/internal"
          className="mono-label inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
        >
          ← ALL ANNEXES
        </Link>

        <header className="mt-6 border-b-2 border-ink pb-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label text-(--ai-review)">INTERNAL ANNEX</span>
            <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
              MODULE {String(m.n).padStart(2, "0")}
            </span>
          </div>
          <h1 className="mt-3 font-display text-[clamp(1.6rem,4.5vw,2.4rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            {m.title}
          </h1>
        </header>

        {/* Content below is rendered only once the cookie verifies. It is not
            sent and hidden — it is not sent. */}
        {!unlocked ? (
          <section className="mt-10">
            <p className="max-w-(--soc-measure) font-mono text-[12.5px] text-muted-2">
              {"// Password required."}
            </p>
            <UnlockForm next={`/ai-soc-prep/internal/${m.slug}`} />
            <p className="mt-6 max-w-(--soc-measure) text-[14px] leading-relaxed text-muted-2">
              The public module is at{" "}
              <Link
                href={`/ai-soc-prep/module/${m.slug}`}
                className="underline hover:text-ink"
              >
                /ai-soc-prep/module/{m.slug}
              </Link>
              .
            </p>
          </section>
        ) : (
          <div className="mt-10 space-y-8">
            {m.annex.map((a, i) => (
              <section key={i}>
                <h2 className="font-display text-[clamp(1.2rem,3vw,1.5rem)] font-bold leading-tight tracking-[-0.025em]">
                  {a.heading}
                </h2>
                <div
                  className="soc-prose mt-3 max-w-(--soc-measure)"
                  dangerouslySetInnerHTML={{ __html: a.body }}
                />
              </section>
            ))}

            <div className="border-t border-hairline pt-6">
              <Link
                href={`/ai-soc-prep/module/${m.slug}`}
                className="mono-label inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
              >
                ← PUBLIC MODULE
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
