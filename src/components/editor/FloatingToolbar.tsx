"use client";

/**
 * FloatingToolbar — typography controls for the active field (Phase 2, Track FE).
 *
 * Appears while editing with a field selected; writes per-field overrides into
 * the section payload's `_styles` map (API_CONTRACT §5): font family (whitelist),
 * size, weight, letter-spacing, line-height, color (design tokens + custom),
 * align, transform, outlined, bold/italic, link. Anchored to the field element.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEditor } from "./InlineEditorProvider";
import { FONT_WEIGHTS, TOKEN_COLORS } from "@/lib/editor/fonts";
import type { StyleOverride } from "@/lib/editor/types";

function pxNum(v?: string): string {
  return v ? String(parseFloat(v)) : "";
}

export function FloatingToolbar() {
  const ed = useEditor();
  const { editMode, activeField } = ed;
  const barRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const reposition = useCallback(() => {
    if (!activeField) return setPos(null);
    const el = document.querySelector<HTMLElement>(`[data-cms-field="${cssEscape(activeField)}"]`);
    if (!el) return setPos(null);
    const r = el.getBoundingClientRect();
    const barH = barRef.current?.offsetHeight ?? 44;
    const top = r.top > barH + 16 ? r.top - barH - 10 : r.bottom + 10;
    setPos({ top: Math.max(8, top), left: Math.max(8, r.left) });
  }, [activeField]);

  useLayoutEffect(reposition, [reposition]);
  useEffect(() => {
    if (!editMode || !activeField) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [editMode, activeField, reposition]);

  if (!editMode || !activeField || !pos) return null;

  const style: StyleOverride = ed.getFieldStyle(activeField) ?? {};
  const patch = (p: StyleOverride) => ed.setFieldStyle(activeField, p);

  return (
    <div
      ref={barRef}
      // Keep the contenteditable's value intact — don't grab focus away destructively.
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "SELECT")
          e.preventDefault();
      }}
      className="fixed z-[70] flex flex-wrap items-center gap-1 rounded-md border-[1.5px] border-ink/80 bg-surface p-1 shadow-offset-sm"
      style={{ top: pos.top, left: pos.left, maxWidth: "min(96vw, 720px)" }}
      role="toolbar"
      aria-label="Text formatting"
    >
      {/* Font family */}
      <select
        aria-label="Font family"
        value={style.font_family ?? ""}
        onChange={(e) => patch({ font_family: e.target.value || undefined })}
        className="mono-label rounded-sm border border-hairline bg-surface px-1.5 py-1 text-ink"
      >
        <option value="">Font…</option>
        {ed.fonts.map((f) => (
          <option key={f.family} value={f.stack}>
            {f.brand ? "★ " : ""}
            {f.label}
          </option>
        ))}
      </select>

      {/* Size */}
      <NumberField
        label="Size"
        suffix="px"
        value={pxNum(style.font_size)}
        onCommit={(n) => patch({ font_size: n ? `${n}px` : undefined })}
        width={52}
      />

      {/* Weight */}
      <select
        aria-label="Weight"
        value={style.font_weight ?? ""}
        onChange={(e) => patch({ font_weight: e.target.value ? Number(e.target.value) : undefined })}
        className="mono-label rounded-sm border border-hairline bg-surface px-1.5 py-1 text-ink"
      >
        <option value="">Wt</option>
        {FONT_WEIGHTS.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>

      <Divider />

      {/* Bold / italic / outlined */}
      <Toggle active={!!style.bold} label="B" title="Bold" onClick={() => patch({ bold: !style.bold })} bold />
      <Toggle active={!!style.italic} label="I" title="Italic" onClick={() => patch({ italic: !style.italic })} italic />
      <Toggle
        active={!!style.outlined}
        label="O"
        title="Outlined (stroke)"
        onClick={() => patch({ outlined: !style.outlined })}
      />

      <Divider />

      {/* Letter spacing / line height */}
      <TextField
        title="Letter spacing"
        placeholder="-0.04em"
        value={style.letter_spacing ?? ""}
        onCommit={(v) => patch({ letter_spacing: v || undefined })}
        width={68}
      />
      <TextField
        title="Line height"
        placeholder="0.94"
        value={style.line_height ?? ""}
        onCommit={(v) => patch({ line_height: v || undefined })}
        width={52}
      />

      <Divider />

      {/* Align */}
      {(["left", "center", "right"] as const).map((a) => (
        <Toggle
          key={a}
          active={style.text_align === a}
          label={a === "left" ? "⇤" : a === "center" ? "≡" : "⇥"}
          title={`Align ${a}`}
          onClick={() => patch({ text_align: a })}
        />
      ))}

      {/* Transform */}
      <Toggle
        active={style.text_transform === "uppercase"}
        label="AA"
        title="Uppercase"
        onClick={() =>
          patch({ text_transform: style.text_transform === "uppercase" ? "none" : "uppercase" })
        }
      />

      <Divider />

      {/* Color swatches + custom */}
      {TOKEN_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => patch({ color: c.value })}
          className={`size-5 rounded-full border ${
            style.color === c.value ? "border-ink ring-1 ring-ink" : "border-hairline"
          }`}
          style={{ background: c.value }}
        />
      ))}
      <input
        type="color"
        aria-label="Custom color"
        onChange={(e) => patch({ color: e.target.value })}
        className="size-6 cursor-pointer rounded-sm border border-hairline bg-surface p-0.5"
      />

      <Divider />

      {/* Link */}
      <button
        type="button"
        title="Set link"
        onClick={() => {
          const url = prompt("Link URL (leave blank to clear):", "");
          if (url === null) return;
          ed.setField(`${activeField.split(".").slice(0, -1).join(".")}.href` || activeField, url);
        }}
        className="mono-label rounded-sm px-2 py-1 text-ink hover:bg-surface-alt"
      >
        ⛓
      </button>

      {/* Close */}
      <button
        type="button"
        title="Done"
        onClick={() => ed.setActiveField(null)}
        className="mono-label rounded-sm px-2 py-1 text-muted-2 hover:bg-surface-alt"
      >
        ✕
      </button>
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-hairline" aria-hidden />;
}

function Toggle({
  active,
  label,
  title,
  onClick,
  bold,
  italic,
}: {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={`grid size-7 place-items-center rounded-sm text-[13px] transition-colors ${
        active ? "bg-ink text-paper" : "text-ink hover:bg-surface-alt"
      } ${bold ? "font-bold" : ""} ${italic ? "italic" : ""}`}
    >
      {label}
    </button>
  );
}

function NumberField({
  label,
  suffix,
  value,
  onCommit,
  width,
}: {
  label: string;
  suffix?: string;
  value: string;
  onCommit: (v: string) => void;
  width: number;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <span className="flex items-center gap-0.5" title={label}>
      <input
        type="number"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => onCommit(v)}
        onKeyDown={(e) => e.key === "Enter" && onCommit(v)}
        className="mono-label rounded-sm border border-hairline bg-surface px-1.5 py-1 text-ink"
        style={{ width }}
      />
      {suffix && <span className="mono-label text-faint">{suffix}</span>}
    </span>
  );
}

function TextField({
  title,
  placeholder,
  value,
  onCommit,
  width,
}: {
  title: string;
  placeholder: string;
  value: string;
  onCommit: (v: string) => void;
  width: number;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      title={title}
      placeholder={placeholder}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onCommit(v)}
      onKeyDown={(e) => e.key === "Enter" && onCommit(v)}
      className="mono-label rounded-sm border border-hairline bg-surface px-1.5 py-1 text-ink"
      style={{ width }}
    />
  );
}

/** Minimal CSS.escape fallback for the attribute selector. */
function cssEscape(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}
