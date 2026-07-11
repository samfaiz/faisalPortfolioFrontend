# Phase 3 — Frontend scaffold

Wire-in-later modules for [docs/PHASE_3.md](../docs/PHASE_3.md) Track FE, built **additively** on
top of the Phase 1–2 app (pages + inline editor in `components/editor/*`, `lib/api.ts`,
`lib/editor/*`) that's being built in parallel. Nothing here overwrites a foundation file — every
module is a new file that imports the existing editor client (`lib/editor/write-client`) and design
tokens (`app/globals.css`).

> Framework-neutral by design: no uninstalled packages are imported, so `next build` /
> `tsc --noEmit` stay green today. TipTap is listed as a follow-up install below.

## What was added

### Libraries (`src/lib/`)
| File | Purpose |
| --- | --- |
| `theme.ts` | Global theme model: `applyTheme` (overrides CSS vars), `loadTheme`/`saveTheme` (settings.theme). |
| `insights.ts` | Auth client for `/insights/*` + `/integrations` (API_CONTRACT §7). |
| `editor/blocks.ts` | `RichDoc`/`RichBlock` JSON model (TipTap-compatible) + helpers. |
| `editor/diff.ts` | Dependency-free `lineDiff` (LCS) + `fieldDiff` for the revision UI. |
| `editor/locking.ts` | Local autosave recovery (works now) + advisory server-lock helpers (fail-soft). |

### Components (`src/components/editor/`)
| File | Purpose |
| --- | --- |
| `blocks/RichEditor.tsx` | Renders a `RichDoc` with the block components — **doubles as the public renderer**. |
| `blocks/CalloutBlock.tsx` | note / tip / warning / danger callout. |
| `blocks/CodeBlock.tsx` | fenced code block (highlighting = follow-up). |
| `blocks/QuoteBlock.tsx` | blockquote + attribution. |
| `blocks/EmbedBlock.tsx` | YouTube/CodePen/generic embed with safe fallback card. |
| `blocks/ImageBlock.tsx` | image + caption. |
| `RevisionDiff.tsx` | revision picker + line diff + restore (uses existing `write-client`). |
| `ThemeEditor.tsx` | live color/font editor writing to `settings.theme`. |

## Wire-up

1. **TipTap rich editing** — install and register in `RichEditor.tsx`:
   ```bash
   npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-link \
         @tiptap/extension-image lowlight @tiptap/extension-code-block-lowlight
   ```
   Register `RICH_BLOCK_EXTENSIONS` (from `lib/editor/blocks.ts`), mount `<EditorContent>` when
   `editable`, and call `onChange(editor.getJSON())`. Reuse the block components as NodeViews so
   edit + view render identically. Store the resulting `RichDoc` JSON on `posts.body` / rich sections.
2. **Revision diff snapshot** — include each revision's `snapshot` in `GET /{type}/{id}/revisions`
   (P3 addition to API_CONTRACT §6) so `RevisionDiff` can render the inline diff. Picker + restore
   work without it.
3. **Theme settings endpoints** — add `GET /api/v1/settings/theme` (public) and
   `PATCH /api/v1/settings/theme` (auth) → `Setting::get/put('theme', …)`. Then mount `<ThemeEditor>`
   in the edit bar. To apply the saved theme on first paint site-wide, call `applyTheme(await loadTheme())`
   from a small client boot component in `app/layout.tsx`.
4. **Editor integration** — surface `RevisionDiff`, `ThemeEditor`, and the rich blocks from the
   existing `EditBar` / `InlineEditorProvider`. Use `locking.saveLocalDraft`/`loadLocalDraft` in the
   editor's autosave path for crash recovery, and `acquireLock`/`startLockHeartbeat` once the lock
   endpoints exist.

## Env
Reuses `NEXT_PUBLIC_API_BASE` (already used by `lib/api.ts` / `lib/editor/write-client.ts`).

## Notes on parallel work
- Additive only — new files in new subdirs (`components/editor/blocks/`) + distinct `lib` filenames,
  so they don't collide with the foundation build.
- The block components render with the existing design tokens, so rich content matches the site
  automatically in light + dark.
