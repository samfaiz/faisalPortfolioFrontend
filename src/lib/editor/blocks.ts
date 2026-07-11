/**
 * Phase 3 — rich content block model (PHASE_3 Track FE: "rich content blocks via
 * TipTap/ProseMirror"). A small, serializable document contract used for blog
 * bodies + rich page sections.
 *
 * This is the storage/JSON shape the RichEditor produces and the public renderer
 * consumes. It intentionally mirrors a ProseMirror/TipTap JSON doc so the editor
 * can be dropped in without a data migration.
 */

export type RichBlockType =
  | "paragraph"
  | "heading"
  | "bulletList"
  | "orderedList"
  | "listItem"
  | "callout"
  | "codeBlock"
  | "blockquote"
  | "embed"
  | "image";

/** Inline text mark (bold/italic/link/code) — matches TipTap mark JSON. */
export interface RichMark {
  type: "bold" | "italic" | "code" | "link";
  attrs?: Record<string, unknown>;
}

/** One node in the document tree. */
export interface RichBlock {
  type: RichBlockType | "text";
  attrs?: Record<string, unknown>;
  content?: RichBlock[];
  text?: string;
  marks?: RichMark[];
}

export interface RichDoc {
  type: "doc";
  content: RichBlock[];
}

/**
 * TipTap extensions the RichEditor should register (install list in
 * frontend/PHASE_3_SCAFFOLD.md). Kept as data so the wiring is explicit.
 */
export const RICH_BLOCK_EXTENSIONS = [
  "StarterKit", // paragraph, heading, bold, italic, bulletList, orderedList, blockquote, code
  "CodeBlockLowlight", // syntax-highlighted code blocks
  "Link",
  "Image",
  "Callout", // custom node — see CalloutBlock
  "Embed", // custom node (YouTube/CodePen/gist) — see EmbedBlock
] as const;

/** Callout tones surfaced in the block toolbar. */
export type CalloutTone = "note" | "tip" | "warning" | "danger";

export function emptyDoc(): RichDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function isEmptyDoc(doc: RichDoc | null | undefined): boolean {
  if (!doc || doc.content.length === 0) return true;
  return doc.content.every(
    (b) => b.type === "paragraph" && (!b.content || b.content.every((c) => !c.text?.trim())),
  );
}

/** Best-effort plain-text extraction (for excerpts, reading time, search). */
export function docToText(doc: RichDoc): string {
  const walk = (node: RichBlock): string => {
    if (node.type === "text") return node.text ?? "";
    return (node.content ?? []).map(walk).join(node.type === "paragraph" ? "" : " ");
  };
  return doc.content.map(walk).join("\n").trim();
}
