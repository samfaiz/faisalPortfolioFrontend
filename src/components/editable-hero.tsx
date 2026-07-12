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
import { BootLine } from "@/components/boot-line";
import type { HeroSection } from "@/lib/types";

export function EditableHero({ hero }: { hero: HeroSection }) {
  return (
    <section className="px-4 pt-6 sm:px-5">
        <div className="scanlines mx-auto max-w-6xl rounded-page border-[1.5px] border-hairline bg-surface p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            {/* Boot line keeps its typing animation (not inline-edited in this slice). */}
            <BootLine text={hero.boot_line} />
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

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="hidden h-0.5 flex-1 bg-ink sm:block" />
            <Editable
              field="home_hero.cta_primary.label"
              as="a"
              href={hero.cta_primary.href}
              className="mono-label rounded-pill bg-ink px-5 py-3 font-semibold text-paper transition-opacity hover:opacity-90"
            />
            <Editable
              field="home_hero.cta_secondary.label"
              as="a"
              href={hero.cta_secondary.href}
              className="mono-label rounded-pill border-[1.5px] border-ink px-5 py-3 font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            />
          </div>
        </div>
    </section>
  );
}
