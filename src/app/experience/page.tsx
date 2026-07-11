import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/json-ld";
import { api } from "@/lib/api";
import { buildMetadata, faqJsonLd, fetchPageSeo } from "@/lib/seo";

const fallbackMeta = {
  title: "Experience",
  description: "The track record — roles, certifications, and what I've shipped in security and software.",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchPageSeo("experience");
  return buildMetadata(seo, fallbackMeta);
}

export default async function ExperiencePage() {
  const [experiences, certifications, stats, seo] = await Promise.all([
    api.experiences(),
    api.certifications(),
    api.stats(),
    fetchPageSeo("experience"),
  ]);
  const faq = faqJsonLd(seo?.faq);

  return (
    <>
      {seo?.json_ld?.length ? <JsonLd data={seo.json_ld} /> : null}
      {faq ? <JsonLd data={faq} /> : null}
      <PageHeader
        line1="THE TRACK"
        line2="RECORD."
        breadcrumb="~/experience"
        action={
          <a href="/resume.pdf" className="mono-label rounded-pill bg-ink px-4 py-2.5 font-semibold text-paper">
            DOWNLOAD RESUME ↓
          </a>
        }
      />

      <section className="px-4 py-10 sm:px-5">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_380px]">
          {/* Roles */}
          <div className="space-y-4">
            {experiences.map((e) => (
              <div
                key={e.id}
                className={`rounded-md border-[1.5px] p-6 ${
                  e.current ? "shadow-offset-sm border-2 border-ink bg-surface" : "border-hairline bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-label rounded-pill bg-surface-alt px-2.5 py-1 text-muted-2">{e.date_label}</span>
                  {e.current && <span className="mono-label text-accent">● CURRENT</span>}
                </div>
                <div className="mt-3 font-display text-xl font-semibold">{e.role}</div>
                <div className="mono-label mt-0.5 text-muted-2">{e.company}</div>
                <p className="mt-3 text-[15px] leading-[1.75] text-muted">{e.summary}</p>
              </div>
            ))}
            <div className="rounded-md border-[1.5px] border-dashed border-faint p-6 text-center">
              <span className="mono-label text-faint">earlier roles &amp; education →</span>
            </div>
          </div>

          {/* Certs + summary */}
          <div className="space-y-6">
            <div className="rounded-lg border-[1.5px] border-hairline bg-surface p-2">
              {certifications.map((c) => (
                <div key={c.id} className="flex items-center gap-3 border-b border-divider px-3 py-3 last:border-0">
                  <div className="stripes size-11 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{c.name}</div>
                    <div className="mono-label text-muted-2">{c.issuer} · {c.year}</div>
                  </div>
                  <span className={`mono-label ${c.status === "done" ? "text-accent" : "text-faint"}`}>
                    {c.status === "done" ? "[✓]" : "[…]"}
                  </span>
                </div>
              ))}
            </div>

            {/* Dark mono summary card */}
            <div className="scanlines rounded-lg bg-ink p-6 font-mono text-[13px] text-on-dark">
              <div className="grid gap-2">
                <Row k="years_in_security" v={stats.years_in_security} />
                <Row k="incidents_handled" v={stats.incidents_handled} />
                <Row k="apps_shipped_with_ai" v={stats.apps_shipped_with_ai} />
                <Row k="status" v={stats.status} accent />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ k, v, accent }: { k: string; v: string | number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-on-dark-faint">{k}</span>
      <span className={accent ? "text-accent-soft" : "text-on-dark"}>{String(v)}</span>
    </div>
  );
}
