/**
 * Inline visual editor (Phase 2, Track FE) — public surface.
 *
 * Import from "@/components/editor". The editor is client-only and auth-gated;
 * mount it via a dynamic import so it never enters the public bundle:
 *
 *   const InlineEditorRoot = dynamic(
 *     () => import("@/components/editor").then((m) => m.InlineEditorRoot),
 *     { ssr: false },
 *   );
 */
export { InlineEditorRoot } from "./InlineEditorRoot";
export { InlineEditorProvider, useEditor, useOptionalEditor } from "./InlineEditorProvider";
export { EditBar } from "./EditBar";
export { FloatingToolbar } from "./FloatingToolbar";
export { Editable } from "./Editable";
export { EditableImage } from "./EditableImage";
export { ImageReplaceModal } from "./ImageReplaceModal";
export type { EditorContextValue } from "./InlineEditorProvider";
