"use client";

/**
 * Editable — binds a single text field to the editor draft (Phase 2, Track FE).
 *
 *   <Editable field="home_hero.headline_line1" as="h1" className="...">
 *     {hero.headline_line1}
 *   </Editable>
 *
 * Outside edit mode it renders a plain element with the field's value and any
 * persisted `_styles`. In edit mode it becomes a constrained contenteditable:
 * live-updates the draft (debounced autosave), commits a history entry on blur,
 * and registers itself as the active field so the FloatingToolbar targets it.
 */
import { createElement, useEffect, useRef } from "react";
import type { CSSProperties, ElementType } from "react";
import { useOptionalEditor } from "./InlineEditorProvider";
import { styleToCss } from "@/lib/editor/paths";

type Tag = "span" | "h1" | "h2" | "h3" | "p" | "div" | "a" | "li" | "label";

export function Editable({
  field,
  as = "span",
  className,
  children,
  href,
}: {
  field: string;
  as?: Tag;
  className?: string;
  /** Fallback content when the draft has no value for this field yet. */
  children?: React.ReactNode;
  /** For link fields rendered as <a> outside edit mode. */
  href?: string;
}) {
  const ed = useOptionalEditor();
  const ref = useRef<HTMLElement>(null);

  const value = ed ? ed.getField(field) : undefined;
  const text = value != null ? String(value) : typeof children === "string" ? children : "";
  const css: CSSProperties = ed ? styleToCss(ed.getFieldStyle(field)) : {};

  // Keep the DOM text in sync with external state changes (undo/redo, discard),
  // but never while the user is typing in this node (would jump the caret).
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (document.activeElement === node) return;
    if (node.innerText !== text) node.innerText = text;
  }, [text]);

  const editing = !!ed?.editMode;
  const Comp = as as ElementType;

  if (!editing) {
    // Public render (also the SSR output): plain element, no editing affordances.
    if (as === "a") {
      return (
        <a href={href} className={className} style={css}>
          {text || children}
        </a>
      );
    }
    return (
      <Comp className={className} style={css}>
        {text || children}
      </Comp>
    );
  }

  // Editing render — built with createElement to keep the dynamic tag from
  // exploding into an over-large JSX union under strict mode.
  return createElement(
    Comp,
    {
      ref,
      className: `${className ?? ""} cms-editable`,
      style: css,
      contentEditable: true,
      suppressContentEditableWarning: true,
      spellCheck: false,
      "data-cms-field": field,
      onFocus: () => ed!.setActiveField(field),
      onMouseUp: () => ed!.setActiveField(field),
      onKeyUp: () => ed!.setActiveField(field),
      onInput: (e: React.FormEvent<HTMLElement>) =>
        ed!.setField(field, (e.currentTarget as HTMLElement).innerText, { commit: false }),
      onBlur: (e: React.FocusEvent<HTMLElement>) =>
        ed!.setField(field, (e.currentTarget as HTMLElement).innerText, { commit: true }),
    },
    text,
  );
}
