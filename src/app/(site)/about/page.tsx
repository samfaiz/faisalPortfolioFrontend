import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/json-ld";
import { ResumeActions } from "@/components/resume-actions";
import { api, fallback, mediaUrl } from "@/lib/api";
import { buildMetadata, faqJsonLd, fetchPageSeo } from "@/lib/seo";

const fallbackMeta = {
  title: "About",
  description:
    "Faisal Khan — cyber security analyst who builds. Defensive security, AppSec, and full-stack products shipped with AI.",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchPageSeo("about");
  return buildMetadata(seo, fallbackMeta);
}

const cards = [
  { tag: "/DEFEND", body: "Threat detection, incident response, and hardening — reducing the blast radius before it matters." },
  { tag: "/BUILD", body: "Full-stack products with Next.js and Laravel, shipped fast with AI in the loop." },
  { tag: "/SHARE", body: "Writeups, CTFs, and notes from the field — learning in public." },
];

export default async function AboutPage() {
  const { aboutIntro } = fallback;
  const [aboutData, settings, seo] = await Promise.all([
    api.aboutPage(),
    api.settings(),
    fetchPageSeo("about"),
  ]);
  const photo = mediaUrl(aboutData.photo);
  const faq = faqJsonLd(seo?.faq);
  return (
    <>
      {seo?.json_ld?.length ? <JsonLd data={seo.json_ld} /> : null}
      {faq ? <JsonLd data={faq} /> : null}
      <PageHeader line1="THE PERSON BEHIND" line2="THE TERMINAL." breadcrumb="~/about" />

      <section className="px-4 py-10 sm:px-5">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[380px_1fr]">
          {/* Photo card */}
          <div className="shadow-offset self-start rounded-lg border-2 border-ink bg-surface p-3">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Faisal Khan" className="aspect-[3/4] w-full rounded-md object-cover" />
            ) : (
              <div className="stripes aspect-[3/4] w-full rounded-md" />
            )}
            <div className="mono-label mt-3 flex items-center justify-between px-1 text-muted-2">
              <span>faisal_khan.jpg</span>
              <span className="text-accent">● DXB</span>
            </div>
          </div>

          {/* Intro */}
          <div>
            <p className="text-[19px] leading-[1.7] text-ink">{aboutIntro.heading}</p>
            <p className="mt-4 text-[15px] leading-[1.85] text-muted">{aboutIntro.body}</p>
            <p className="mt-3 text-[15px] leading-[1.85] text-muted">
              I care about the boring parts that actually keep systems safe — least privilege, patch hygiene,
              logging you can reason about — and I bring that same discipline to the products I ship.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {cards.map((c) => (
                <div key={c.tag} className="rounded-md border-[1.5px] border-hairline bg-surface p-4">
                  <div className="mono-label text-accent-strong">{c.tag}</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dark CTA band */}
      <section className="px-4 pb-4 sm:px-5">
        <div className="scanlines mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-page bg-panel p-8 text-on-dark">
          <p className="font-display text-xl font-semibold">Curious how I work? See the projects.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/projects" className="mono-label rounded-pill border border-on-dark-faint/40 px-4 py-2.5 text-on-dark transition-colors hover:border-accent-soft">PROJECTS →</Link>
            <ResumeActions settings={settings} variant="dark" />
          </div>
        </div>
      </section>
    </>
  );
}
