"use client";

/**
 * EditableHero — the real Home hero with inline-editor bindings (Phase 2).
 *
 * Binds each text/image node with <Editable>/<EditableImage>. The editor root
 * (provider + edit bar) is mounted once at the page level so the whole home page
 * shares a single edit session; this component only contributes bindings. With
 * no admin token it renders identical public output (SSR-safe).
 */
import { Editable } from "@/components/editor/Editable";
import { EditableImage } from "@/components/editor/EditableImage";
import { BootLineEditable, type BootLinePost } from "@/components/boot-line-editable";
import { ResumeViewer } from "@/components/resume-viewer";
import type { HeroSection } from "@/lib/types";

export function EditableHero({
  hero,
  posts = [],
  resumeHref,
  resumeView,
}: {
  hero: HeroSection;
  posts?: BootLinePost[];
  /** When a resume is uploaded, the secondary CTA ("RESUME") downloads it. */
  resumeHref?: string;
  /** Inline-view URL for the resume — shown as the eye button. */
  resumeView?: string;
}) {
  return (
    <section className="px-4 pt-6 sm:px-5">
        <div className="scanlines mx-auto max-w-6xl rounded-page border-[1.5px] border-hairline bg-surface p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            {/* Boot line: editable text + optional blog link (typing animation preserved). */}
            <BootLineEditable text={hero.boot_line} url={hero.boot_line_url} posts={posts} />
            <Editable
              field="home_hero.status_pill"
              className="mono-label rounded-pill bg-accent/10 px-3 py-1.5 text-accent-strong"
            />
          </div>

          <div className="mt-8 flex items-center gap-4">
            <EditableImage
              field="home_hero.photo"
              className="stripes shrink-0 rounded-full border-[1.5px] border-hairline"
              fallbackAlt="Faisal Khan"
            />
            <div>
              <Editable field="home_hero.name" as="div" className="font-display text-lg font-semibold" />
              <Editable field="home_hero.tagline" as="div" className="mono-label text-muted-2" />
            </div>
          </div>

          <h1 className="mt-8 font-display font-bold uppercase leading-[0.94] tracking-[-0.04em] text-ink text-[clamp(2.75rem,11vw,5.75rem)]">
            <Editable field="home_hero.headline_line1" as="span" />
            <br />
            <Editable field="home_hero.headline_line2" as="span" className="text-stroke-ink" />
            <span className="text-accent">*</span>
          </h1>

          <div className="mt-8 max-w-xl space-y-1">
            <Editable field="home_hero.footnote.0" as="p" className="mono-label text-muted-2" />
            <Editable field="home_hero.footnote.1" as="p" className="mono-label text-muted-2" />
            <Editable field="home_hero.footnote.2" as="p" className="mono-label text-muted-2" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="hidden h-0.5 flex-1 bg-ink sm:block" />
            <Editable
              field="home_hero.cta_primary.label"
              as="a"
              href={hero.cta_primary.href}
              className="mono-label rounded-pill bg-ink px-4 py-2.5 font-semibold text-paper transition-opacity hover:opacity-90 sm:px-5 sm:py-3"
            />
            <div className="flex items-center gap-2">
              <Editable
                field="home_hero.cta_secondary.label"
                as="a"
                href={resumeHref ?? hero.cta_secondary.href}
                className="mono-label rounded-pill border-[1.5px] border-ink px-4 py-2.5 font-semibold text-ink transition-colors hover:bg-ink hover:text-paper sm:px-5 sm:py-3"
              />
              {resumeView && <ResumeViewer viewUrl={resumeView} downloadUrl={resumeHref} />}
            </div>
          </div>
        </div>
    </section>
  );
}
