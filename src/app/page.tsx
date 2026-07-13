import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { Marquee } from "@/components/marquee";
import { LiveViewer } from "@/components/live-viewer";
import { EditableHero } from "@/components/editable-hero";
import { InlineEditorRoot } from "@/components/editor/InlineEditorRoot";
import { Editable } from "@/components/editor/Editable";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, faqJsonLd, fetchPageSeo } from "@/lib/seo";

const SITE_URL = "https://faisalkhan.dev";

const fallbackMeta = {
  title: "Faisal Khan — Cyber Security Analyst",
  description:
    "Faisal Khan — Cyber Security Analyst who builds full-stack products with AI. Threat detection, incident response, and shipped software.",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchPageSeo("home");
  return buildMetadata(seo, fallbackMeta);
}

export default async function Home() {
  const [hero, about, skills, projects, experiences, posts, settings, seo] = await Promise.all([
    api.hero(),
    api.about(),
    api.skills(),
    api.projects(),
    api.experiences(),
    api.posts(),
    api.settings(),
    fetchPageSeo("home"),
  ]);
  const resumeHref = settings.resume_download ?? settings.resume_url ?? undefined;
  const resumeView = settings.resume_url ?? settings.resume_download ?? undefined;

  // Baseline structured data — always emitted, merged with any backend JSON-LD.
  const baselineLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Faisal Khan",
      jobTitle: "Cyber Security Analyst",
      url: SITE_URL,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Faisal Khan",
      url: SITE_URL,
    },
  ];
  const faq = faqJsonLd(seo?.faq);
  const jsonLd = [
    ...(seo?.json_ld ?? []),
    ...baselineLd,
    ...(faq ? [faq] : []),
  ];

  return (
    <InlineEditorRoot
      initialSections={
        { home_hero: hero, home_about: about, home_skills: skills } as unknown as Record<
          string,
          Record<string, unknown>
        >
      }
    >
      <JsonLd data={jsonLd} />
      {/* ===== Hero (inline-editable) ===== */}
      <EditableHero
        hero={hero}
        posts={posts.map((p) => ({ title: p.title, slug: p.slug }))}
        resumeHref={resumeHref}
        resumeView={resumeView}
      />

      {/* ===== Marquee ===== */}
      <section className="px-4 py-8 sm:px-5">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-pill">
          <Marquee />
        </div>
      </section>

      {/* ===== About teaser /01 (inline-editable) ===== */}
      <section className="px-4 py-10 sm:px-5">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[auto_1fr]">
          <div>
            <Editable
              field="home_about.eyebrow"
              as="span"
              className="mono-label grid size-9 place-items-center rounded-md bg-accent/10 font-semibold text-accent-strong"
            >
              {about.eyebrow}
            </Editable>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <Editable
                field="home_about.heading"
                as="h2"
                className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-[-0.03em]"
              >
                {about.heading}
              </Editable>
              <Editable field="home_about.body" as="p" className="mt-4 text-[15px] leading-[1.85] text-muted">
                {about.body}
              </Editable>
            </div>
            <div className="grid grid-cols-2 gap-3 self-start">
              {about.facts.map((f, i) => (
                <div key={i} className={`rounded-md border-[1.5px] p-4 ${f.accent ? "border-accent/45 bg-accent/10" : "border-hairline bg-surface"}`}>
                  <Editable field={`home_about.facts.${i}.label`} as="div" className="mono-label text-faint">
                    {f.label}
                  </Editable>
                  <Editable field={`home_about.facts.${i}.value`} as="div" className="mt-1.5 text-sm font-medium text-ink">
                    {f.value}
                  </Editable>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Skills /02 (inline-editable) ===== */}
      <section className="px-4 py-10 sm:px-5">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-baseline gap-3">
            <span className="mono-label text-accent-strong">/02</span>
            <Editable field="home_skills.title" as="h2" className="font-display text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold tracking-[-0.03em]">
              {skills.title}
            </Editable>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {skills.groups.map((s, gi) => (
              <div key={gi} className={`rounded-lg border-2 border-ink p-6 ${s.tinted ? "bg-surface-alt" : "bg-surface"}`}>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: s.dot }} />
                  <Editable field={`home_skills.groups.${gi}.label`} as="span" className="mono-label font-semibold text-ink">
                    {s.label}
                  </Editable>
                </div>
                <ul className="mt-4 space-y-0 text-[15px] leading-[2.15] text-muted">
                  {s.items.map((it, ii) => (
                    <li key={ii}>
                      <Editable field={`home_skills.groups.${gi}.items.${ii}`} as="span">
                        {it}
                      </Editable>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Projects /03 ===== */}
      <section className="px-4 py-10 sm:px-5">
        <div className="mx-auto max-w-6xl">
          <SectionLabel n="/03" title="Try them live" />
          <div className="mt-6">
            <LiveViewer projects={projects} />
          </div>
        </div>
      </section>

      {/* ===== Experience preview /04 ===== */}
      <section className="px-4 py-10 sm:px-5">
        <div className="mx-auto max-w-6xl">
          <SectionLabel n="/04" title="The track record" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {experiences.map((e) => (
              <div key={e.id} className={`rounded-md border-[1.5px] p-5 ${e.current ? "border-accent/45 bg-accent/10" : "border-hairline bg-surface"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`mono-label rounded-pill px-2.5 py-1 ${e.current ? "bg-accent/15 text-accent-strong" : "bg-surface-alt text-muted-2"}`}>
                    {e.date_label}
                  </span>
                  {e.current && <span className="mono-label text-accent">● CURRENT</span>}
                </div>
                <div className="mt-3 font-display text-lg font-semibold">{e.role}</div>
                <div className="mono-label mt-0.5 text-muted-2">{e.company}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{e.summary}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/experience" className="mono-label rounded-pill border-[1.5px] border-ink px-4 py-2.5 text-ink transition-colors hover:bg-ink hover:text-paper">
              FULL EXPERIENCE →
            </Link>
          </div>
        </div>
      </section>
    </InlineEditorRoot>
  );
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="mono-label text-accent-strong">{n}</span>
      <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold tracking-[-0.03em]">{title}</h2>
    </div>
  );
}
