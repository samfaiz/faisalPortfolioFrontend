"use client";

/**
 * Phase 3 — global theme editor (PHASE_3 Track FE: "global theme editor writing
 * to `settings`"). Retune site-wide colors + fonts with a live preview, then save.
 *
 * Live preview overrides the CSS custom properties in app/globals.css; Save
 * persists to settings.theme via lib/theme.ts.
 */
import { useEffect, useState } from "react";
import {
  applyTheme,
  clearThemeOverrides,
  loadTheme,
  saveTheme,
  THEME_COLOR_VARS,
  type ThemeColorVar,
  type ThemeTokens,
} from "@/lib/theme";

const FONT_STACKS: { label: string; value: string }[] = [
  { label: "Space Grotesk (brand)", value: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif" },
  { label: "System sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, serif" },
];

export function ThemeEditor({ onClose }: { onClose?: () => void }) {
  const [tokens, setTokens] = useState<ThemeTokens>({ colors: {}, fonts: {} });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    void loadTheme().then((t) => {
      if (t) {
        setTokens(t);
        applyTheme(t);
      }
    });
  }, []);

  function setColor(name: ThemeColorVar, value: string) {
    const next: ThemeTokens = { ...tokens, colors: { ...tokens.colors, [name]: value } };
    setTokens(next);
    applyTheme({ colors: { [name]: value } });
    setStatus("idle");
  }

  function setFont(kind: "display" | "mono", value: string) {
    const next: ThemeTokens = { ...tokens, fonts: { ...tokens.fonts, [kind]: value } };
    setTokens(next);
    applyTheme({ fonts: { [kind]: value } });
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    setStatus((await saveTheme(tokens)) ? "saved" : "error");
  }

  function reset() {
    clearThemeOverrides();
    setTokens({ colors: {}, fonts: {} });
    void loadTheme().then((t) => t && applyTheme(t));
    setStatus("idle");
  }

  return (
    <div className="flex w-72 flex-col gap-4 rounded-lg border border-hairline bg-surface p-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="mono-label text-muted">THEME</h3>
        {onClose ? (
          <button onClick={onClose} className="mono-label text-faint hover:text-ink">
            CLOSE
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {THEME_COLOR_VARS.map((name) => (
          <label key={name} className="flex items-center gap-2">
            <input
              type="color"
              aria-label={name}
              value={toHex(tokens.colors?.[name])}
              onChange={(e) => setColor(name, e.target.value)}
              className="h-6 w-6 shrink-0 cursor-pointer rounded border border-hairline bg-transparent"
            />
            <span className="mono-label truncate text-faint">{name}</span>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className="mono-label text-faint">DISPLAY FONT</span>
        <select
          value={tokens.fonts?.display ?? FONT_STACKS[0].value}
          onChange={(e) => setFont("display", e.target.value)}
          className="rounded border border-hairline bg-paper px-2 py-1 text-ink"
        >
          {FONT_STACKS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <button
          onClick={() => void save()}
          disabled={status === "saving"}
          className="mono-label flex-1 rounded bg-ink px-3 py-1.5 text-on-dark disabled:opacity-50"
        >
          {status === "saving" ? "SAVING…" : status === "saved" ? "SAVED ✓" : "SAVE"}
        </button>
        <button onClick={reset} className="mono-label rounded border border-hairline px-3 py-1.5 text-muted">
          RESET
        </button>
      </div>
      {status === "error" ? <p className="text-red-500">Save failed — check auth + backend route.</p> : null}
    </div>
  );
}

/** A color input needs a hex value; pass through hex, else a neutral default. */
function toHex(value: string | undefined): string {
  if (value && /^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return "#888888";
}
