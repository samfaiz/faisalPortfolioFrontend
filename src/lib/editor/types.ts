/**
 * Inline visual editor — shared types (Phase 2, Track FE).
 *
 * The editor lets a logged-in admin edit any page in place. Editable elements
 * are annotated with `data-cms-field="<section_key>.<path>"` (see paths.ts) and
 * every text field may carry a sibling **style override** persisted under the
 * section payload's `_styles` map — mirrors docs/API_CONTRACT.md §5.
 */

/** Per-field typography overrides written by the FloatingToolbar (API_CONTRACT §5). */
export interface StyleOverride {
  font_family?: string; // must be one of the allowed-fonts whitelist
  font_size?: string; // e.g. "92px"
  font_weight?: number; // 400 | 500 | 600 | 700
  letter_spacing?: string; // e.g. "-0.04em"
  line_height?: string; // e.g. "0.94"
  color?: string; // token var or hex
  text_align?: "left" | "center" | "right" | "justify";
  text_transform?: "none" | "uppercase" | "lowercase" | "capitalize";
  outlined?: boolean; // transparent fill + -webkit-text-stroke
  bold?: boolean;
  italic?: boolean;
}

/** `_styles` is a map of leaf-field-name -> StyleOverride inside a section payload. */
export type StyleMap = Record<string, StyleOverride>;

/** A font offered in the toolbar dropdown (from GET /api/v1/fonts, with a fallback). */
export interface FontOption {
  family: string;
  label: string;
  /** CSS stack to apply when this family is chosen. */
  stack: string;
  /** Brand fonts are surfaced first / marked. */
  brand?: boolean;
}

/** Save lifecycle shown in the edit bar + per-field indicator. */
export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

/** Publish state badge. */
export type PublishState = "published" | "draft";

/** A parsed field binding: which section + the dotted path within its payload. */
export interface FieldBinding {
  /** Section key, e.g. "home_hero". */
  section: string;
  /** Dotted path within the section payload, e.g. "cta_primary.label". */
  path: string;
  /** The leaf name used to key `_styles`, e.g. "headline_line1". */
  leaf: string;
  /** The original raw binding string, e.g. "home_hero.headline_line1". */
  raw: string;
}

/** A media asset returned by upload / replace-image (API_CONTRACT §2 MediaAsset). */
export interface MediaAsset {
  id: number;
  url: string;
  alt?: string | null;
  title?: string | null;
  width?: number | null;
  height?: number | null;
}

/** One entry in a section's revision history (API_CONTRACT §6). */
export interface Revision {
  id: number;
  label?: string | null;
  created_at: string;
  user?: { name: string } | null;
}

/** Editable entity kinds that support publish/unpublish + revisions. */
export type EditableType = "sections" | "projects" | "posts" | "experiences";
