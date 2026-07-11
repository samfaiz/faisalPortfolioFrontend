/**
 * Phase 3 — global theme editor model (PHASE_3 Track FE: "global theme editor
 * writing to `settings`"). Lets an admin retune site-wide colors + fonts, preview
 * live by overriding the CSS custom properties defined in app/globals.css, and
 * persist to the backend `settings.theme` row.
 *
 * Additive: reuses the editor's Sanctum token (lib/editor/write-client) and the
 * same /api/v1 base; does not touch the public read client (lib/api.ts).
 */
import { getToken } from "./editor/write-client";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

/** The themeable color tokens (mirrors the `--<name>` vars in globals.css). */
export type ThemeColorVar =
  | "paper"
  | "surface"
  | "surface-alt"
  | "ink"
  | "muted"
  | "accent"
  | "accent-strong"
  | "accent-soft"
  | "hairline"
  | "divider";

export const THEME_COLOR_VARS: readonly ThemeColorVar[] = [
  "paper",
  "surface",
  "surface-alt",
  "ink",
  "muted",
  "accent",
  "accent-strong",
  "accent-soft",
  "hairline",
  "divider",
] as const;

export interface ThemeTokens {
  /** Partial map of token → CSS color value (hex / oklch / var). */
  colors?: Partial<Record<ThemeColorVar, string>>;
  fonts?: {
    /** CSS stack applied to --font-display. */
    display?: string;
    /** CSS stack applied to --font-mono. */
    mono?: string;
  };
}

/** Apply tokens to the live document by overriding CSS custom properties. */
export function applyTheme(tokens: ThemeTokens): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  for (const [name, value] of Object.entries(tokens.colors ?? {})) {
    if (value) root.style.setProperty(`--${name}`, value);
  }
  if (tokens.fonts?.display) root.style.setProperty("--font-display", tokens.fonts.display);
  if (tokens.fonts?.mono) root.style.setProperty("--font-mono", tokens.fonts.mono);
}

/** Remove all inline overrides, reverting to the stylesheet defaults. */
export function clearThemeOverrides(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const name of THEME_COLOR_VARS) root.style.removeProperty(`--${name}`);
  root.style.removeProperty("--font-display");
  root.style.removeProperty("--font-mono");
}

/**
 * Load the persisted theme (public read).
 * WIRE-UP: backend must expose GET /api/v1/settings/theme (P3 addition to the
 * API contract). Returns null if unset or unreachable.
 */
export async function loadTheme(): Promise<ThemeTokens | null> {
  try {
    const res = await fetch(`${BASE}/settings/theme`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    // The settings API may wrap the value ({ value: {...} }) or return it bare.
    const json = (await res.json()) as { value?: ThemeTokens } & ThemeTokens;
    return json.value ?? (json as ThemeTokens) ?? null;
  } catch {
    return null;
  }
}

/**
 * Persist the theme (auth). WIRE-UP: backend PATCH /api/v1/settings/theme,
 * writing to the `settings` table (Setting::put('theme', $value)).
 */
export async function saveTheme(tokens: ThemeTokens): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch(`${BASE}/settings/theme`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ value: tokens }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
