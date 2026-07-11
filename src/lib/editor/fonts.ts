/**
 * Allowed-fonts whitelist for the FloatingToolbar's font-family dropdown.
 *
 * The live list comes from `GET /api/v1/fonts` (API_CONTRACT §5); this is the
 * offline fallback so the toolbar works before the backend endpoint exists.
 * Brand fonts are pinned first — a constrained set keeps inline edits on-system.
 */
import type { FontOption } from "./types";

export const FALLBACK_FONTS: FontOption[] = [
  {
    family: "Space Grotesk",
    label: "Space Grotesk (display)",
    stack: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
    brand: true,
  },
  {
    family: "JetBrains Mono",
    label: "JetBrains Mono (mono)",
    stack: "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, monospace",
    brand: true,
  },
  { family: "Inter", label: "Inter", stack: "Inter, system-ui, sans-serif" },
  { family: "Geist", label: "Geist", stack: "Geist, system-ui, sans-serif" },
  { family: "IBM Plex Mono", label: "IBM Plex Mono", stack: "'IBM Plex Mono', monospace" },
  { family: "Sora", label: "Sora", stack: "Sora, system-ui, sans-serif" },
  { family: "Fraunces", label: "Fraunces (serif)", stack: "Fraunces, Georgia, serif" },
  { family: "Georgia", label: "Georgia (serif)", stack: "Georgia, 'Times New Roman', serif" },
];

/** Design-token color swatches offered before the custom picker (matches globals.css). */
export const TOKEN_COLORS: { label: string; value: string }[] = [
  { label: "Ink", value: "var(--ink)" },
  { label: "Muted", value: "var(--muted)" },
  { label: "Faint", value: "var(--faint)" },
  { label: "Accent", value: "var(--accent)" },
  { label: "Accent strong", value: "var(--accent-strong)" },
  { label: "Paper", value: "var(--paper)" },
];

export const FONT_WEIGHTS = [400, 500, 600, 700] as const;
