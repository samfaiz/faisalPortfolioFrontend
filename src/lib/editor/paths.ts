/**
 * Field-binding path helpers.
 *
 * Editable elements carry `data-cms-field="home_hero.headline_line1"`.
 * The first segment is the **section key**; the remainder is a dotted path
 * (supporting array indices, e.g. "footnote.0") into that section's payload.
 */
import type { FieldBinding, StyleMap, StyleOverride } from "./types";

/** Parse a raw `data-cms-field` binding into its section + path parts. */
export function parseBinding(raw: string): FieldBinding {
  const [section, ...rest] = raw.split(".");
  const path = rest.join(".");
  const leaf = rest.length ? rest[rest.length - 1] : section;
  return { section, path, leaf, raw };
}

/** Read a nested value from an object by dotted path (array indices allowed). */
export function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

/**
 * Immutably set a nested value by dotted path, creating intermediate
 * objects/arrays as needed. Returns a new root (does not mutate `obj`).
 */
export function setByPath<T extends object>(obj: T, path: string, value: unknown): T {
  if (!path) return value as T;
  const keys = path.split(".");
  const root = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string, unknown>;
  let cursor: Record<string, unknown> = root;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const existing = cursor[key];
    const clone = Array.isArray(existing)
      ? [...existing]
      : existing && typeof existing === "object"
        ? { ...(existing as Record<string, unknown>) }
        : /^\d+$/.test(nextKey)
          ? []
          : {};
    cursor[key] = clone;
    cursor = clone as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
  return root as T;
}

/** Read the StyleOverride for a field from a section payload's `_styles` map. */
export function getStyle(payload: unknown, leaf: string): StyleOverride | undefined {
  const styles = (payload as { _styles?: StyleMap } | null)?._styles;
  return styles?.[leaf];
}

/**
 * Immutably merge a partial StyleOverride into `payload._styles[leaf]`.
 * Returns a new payload.
 */
export function setStyle<T extends object>(
  payload: T,
  leaf: string,
  patch: StyleOverride,
): T {
  const current = (payload as { _styles?: StyleMap })._styles ?? {};
  const merged: StyleMap = {
    ...current,
    [leaf]: { ...(current[leaf] ?? {}), ...patch },
  };
  return { ...(payload as object), _styles: merged } as T;
}

/** Convert a StyleOverride into a React inline-style object. */
export function styleToCss(s?: StyleOverride): React.CSSProperties {
  if (!s) return {};
  const css: React.CSSProperties = {};
  if (s.font_family) css.fontFamily = s.font_family;
  if (s.font_size) css.fontSize = s.font_size;
  if (s.font_weight) css.fontWeight = s.font_weight;
  if (s.letter_spacing) css.letterSpacing = s.letter_spacing;
  if (s.line_height) css.lineHeight = s.line_height;
  if (s.text_align) css.textAlign = s.text_align;
  if (s.text_transform) css.textTransform = s.text_transform;
  if (s.bold) css.fontWeight = 700;
  if (s.italic) css.fontStyle = "italic";
  if (s.outlined) {
    css.color = "transparent";
    (css as Record<string, string>).WebkitTextStroke = `2px ${s.color ?? "var(--ink)"}`;
  } else if (s.color) {
    css.color = s.color;
  }
  return css;
}
