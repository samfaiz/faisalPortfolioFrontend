"use client";

/**
 * /editor-demo — a self-contained showcase of the Phase 2 inline visual editor.
 *
 * Runs in `localOnly` mode (no backend token required), so edits stay in local
 * state and you can exercise the full system: toggle EDIT MODE in the bottom
 * bar, click any text to edit it in place, select a field to get the floating
 * typography toolbar (font/size/weight/color/outlined/…), click the photo to
 * open the media picker, and use Undo/Redo + Discard.
 *
 * This route is additive and touches no shared files — the real integration
 * (wrapping live pages) is documented in src/components/editor/README.md.
 */
import { InlineEditorRoot } from "@/components/editor";
import { Editable } from "@/components/editor/Editable";
import { EditableImage } from "@/components/editor/EditableImage";

const initialSections = {
  home_hero: {
    boot_line: "> portfolio v2.0 — initializing…",
    status_pill: "DXB · ● OPEN TO WORK",
    name: "Faisal Khan",
    tagline: "cyber security analyst // full-stack + AI",
    photo: null as { id?: number; url?: string; alt?: string } | null,
    headline_line1: "CYBER SECURITY",
    headline_line2: "ANALYST",
    footnote: [
      "detection • response • hardening",
      "ships full-stack products with AI",
      "based in Dubai, open to work",
    ],
    cta_primary: { label: "VIEW PROJECTS ↗", href: "/projects" },
    cta_secondary: { label: "RESUME ↓", href: "/resume.pdf" },
    _styles: {
      headline_line1: { font_weight: 700, letter_spacing: "-0.04em" },
      headline_line2: { outlined: true, font_weight: 700, letter_spacing: "-0.04em" },
    },
  },
};

export default function EditorDemoPage() {
  return (
    <InlineEditorRoot initialSections={initialSections} localOnly>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-5">
        {/* How-to banner */}
        <div className="mb-6 rounded-md border-[1.5px] border-accent/45 bg-accent/10 p-4">
          <div className="mono-label font-semibold text-accent-strong">PHASE 2 · INLINE EDITOR DEMO</div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Toggle <b>EDIT MODE</b> in the bar at the bottom. Then click any text below to edit it in
            place; a floating toolbar appears for font, size, weight, colour, outlined text and
            alignment. Click the round photo to replace it. Changes autosave to a draft (local in
            this demo) — try Undo/Redo and Discard.
          </p>
        </div>

        {/* Hero replica with field bindings */}
        <section className="scanlines rounded-page border-[1.5px] border-hairline bg-surface p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <Editable
              field="home_hero.boot_line"
              className="mono-label rounded-pill border border-hairline px-3 py-1.5 text-muted-2"
            />
            <Editable
              field="home_hero.status_pill"
              className="mono-label rounded-pill bg-accent/10 px-3 py-1.5 text-accent-strong"
            />
          </div>

          <div className="mt-8 flex items-center gap-4">
            <EditableImage
              field="home_hero.photo"
              className="size-13 shrink-0 rounded-full border-[1.5px] border-hairline"
              fallbackAlt="Faisal Khan"
            />
            <div>
              <Editable field="home_hero.name" as="div" className="font-display text-lg font-semibold" />
              <Editable field="home_hero.tagline" as="div" className="mono-label text-muted-2" />
            </div>
          </div>

          <h1 className="mt-8 font-display uppercase leading-[0.94] text-ink text-[clamp(2.75rem,11vw,5.75rem)]">
            <Editable field="home_hero.headline_line1" as="span" />
            <br />
            <Editable field="home_hero.headline_line2" as="span" />
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
              className="mono-label rounded-pill bg-ink px-5 py-3 font-semibold text-paper"
            />
            <Editable
              field="home_hero.cta_secondary.label"
              className="mono-label rounded-pill border-[1.5px] border-ink px-5 py-3 font-semibold text-ink"
            />
          </div>
        </section>
      </div>
    </InlineEditorRoot>
  );
}
