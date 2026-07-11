# Inline Visual Editor (Phase 2, Track FE)

Edit **any page in place** with full typography controls, drafts, autosave,
publish, and undo/redo — the Phase 2 differentiator from
[`docs/PHASE_2.md`](../../../../docs/PHASE_2.md) (Track FE) built against
[`docs/API_CONTRACT.md`](../../../../docs/API_CONTRACT.md) §1, §5, §6.

It is **client-only, auth-gated, and additive**: with no Sanctum token the
chrome hides and pages render exactly as the public build. Nothing here imports
or modifies the FE worker's public files (`layout.tsx`, `page.tsx`, `lib/api.ts`,
`lib/types.ts`) — so it drops in without collision.

## Try it now

Run the dev server and open **`/editor-demo`** — a self-contained showcase in
`localOnly` mode (no backend needed). Toggle **EDIT MODE**, click text to edit,
select a field for the floating toolbar, click the photo to replace it.

## Pieces

| File | Role |
| --- | --- |
| `InlineEditorProvider` | State engine: working drafts, dirty tracking, **debounced autosave**, undo/redo (coalesced), unsaved-changes guard, publish/discard. |
| `InlineEditorRoot` | One-line mount = provider + `EditBar` + `FloatingToolbar`. |
| `EditBar` | Persistent dock: mode toggle, draft/published badge, save status, undo/redo, Discard, Publish. |
| `Editable` | Binds a text field: constrained `contenteditable` in edit mode, plain element otherwise. |
| `FloatingToolbar` | Per-field typography → `_styles` (font/size/weight/spacing/line-height/color/align/transform/outlined/bold/italic/link). |
| `EditableImage` + `ImageReplaceModal` | Click image → media library (browse/upload) → swap `src` + `alt`. |
| `@/lib/editor/*` | `paths` (binding parse + immutable get/set + `_styles`), `write-client` (Sanctum), `fonts`, `types`. |

## Field bindings

Annotate editable elements with `field="<section_key>.<path>"`:

```tsx
<Editable field="home_hero.headline_line1" as="span" />
<Editable field="home_hero.cta_primary.label" className="…" />
<Editable field="home_hero.footnote.0" as="p" />       {/* array index */}
<EditableImage field="home_hero.photo" className="size-13 rounded-full" />
```

The first segment is the section key; the rest is a dotted path into that
section's payload. Style overrides persist under `payload._styles[<leaf>]`.

## Wiring a live page (the one line)

Keep the editor **out of the public bundle** with a dynamic, SSR-off import, and
feed it the section payloads the page already fetched (use `?preview=1` when a
token is present so drafts show):

```tsx
import dynamic from "next/dynamic";
const InlineEditorRoot = dynamic(
  () => import("@/components/editor").then((m) => m.InlineEditorRoot),
  { ssr: false },
);

export default async function Home() {
  const hero = await api.hero();
  return (
    <InlineEditorRoot initialSections={{ home_hero: hero }}>
      {/* replace the hero's static text nodes with <Editable field="home_hero.…"> */}
    </InlineEditorRoot>
  );
}
```

Because `<Editable>`/`<EditableImage>` render plain output when there's no editor
in the tree (or edit mode is off), the same components are safe in the public
render.

## Backend endpoints it expects (owned by the BE worker)

- `PATCH /api/v1/sections/{key}` — partial draft update (+ `_styles`)
- `GET  /api/v1/fonts` — allowed-fonts whitelist (falls back to `lib/editor/fonts.ts`)
- `POST /api/v1/{type}/{id}/publish` · `/unpublish`
- `GET  /api/v1/{type}/{id}/revisions` · `POST …/revisions/{rev}/restore`
- `POST /api/v1/media` (upload) · `GET /api/v1/media` (library) · `PATCH /api/v1/sections/{key}/replace-image`
- Auth: `Authorization: Bearer <sanctum>`; token stored in `localStorage["cms_token"]`.

Until those exist, the editor still runs (autosave/publish fail gracefully; the
demo uses `localOnly`).
