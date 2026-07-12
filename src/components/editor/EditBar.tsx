"use client";

/**
 * EditBar — the persistent edit-mode control bar (Phase 2, Track FE).
 * Floating pill dock: mode toggle, draft/published badge, save status,
 * undo/redo, Discard, Publish. Only renders when the editor is enabled
 * (a Sanctum token is present).
 */
import { useEditor } from "./InlineEditorProvider";
import type { SaveStatus } from "@/lib/editor/types";

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: "Up to date",
  dirty: "Unsaved…",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

const SAVE_DOT: Record<SaveStatus, string> = {
  idle: "bg-faint",
  dirty: "bg-amber-500",
  saving: "bg-amber-500 animate-pulse",
  saved: "bg-accent",
  error: "bg-red-500",
};

export function EditBar() {
  const ed = useEditor();
  if (!ed.enabled) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div className="scanlines flex flex-wrap items-center gap-2 rounded-pill border-[1.5px] border-ink/80 bg-panel px-2.5 py-2 text-on-dark shadow-offset-sm">
        {/* Mode toggle */}
        <button
          type="button"
          onClick={() => ed.setEditMode(!ed.editMode)}
          aria-pressed={ed.editMode}
          className={`mono-label rounded-pill px-3 py-1.5 font-semibold transition-colors ${
            ed.editMode ? "bg-accent text-paper" : "bg-transparent text-on-dark hover:bg-white/10"
          }`}
        >
          {ed.editMode ? "● EDITING" : "○ EDIT MODE"}
        </button>

        <Divider />

        {/* Draft / published badge */}
        <span
          className={`mono-label rounded-pill px-2.5 py-1 ${
            ed.isDirty ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-on-dark-muted"
          }`}
        >
          {ed.isDirty ? "DRAFT" : "PUBLISHED"}
        </span>

        {/* Save status */}
        <span className="mono-label flex items-center gap-1.5 px-1 text-on-dark-muted">
          <span className={`size-2 rounded-full ${SAVE_DOT[ed.saveStatus]}`} />
          {SAVE_LABEL[ed.saveStatus]}
          {ed.dirtyCount > 0 && ed.saveStatus !== "saved" ? ` (${ed.dirtyCount})` : ""}
        </span>

        <Divider />

        {/* Undo / redo */}
        <button
          type="button"
          onClick={ed.undo}
          disabled={!ed.canUndo}
          title="Undo (Ctrl/Cmd+Z)"
          className="mono-label rounded-pill px-2.5 py-1.5 text-on-dark transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={ed.redo}
          disabled={!ed.canRedo}
          title="Redo (Ctrl/Cmd+Shift+Z)"
          className="mono-label rounded-pill px-2.5 py-1.5 text-on-dark transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          ↷
        </button>

        <Divider />

        {/* Discard / publish */}
        <button
          type="button"
          onClick={() => {
            if (confirm("Discard all unsaved changes and revert to the last published version?"))
              ed.discardAll();
          }}
          disabled={!ed.isDirty}
          className="mono-label rounded-pill px-3 py-1.5 text-on-dark transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          DISCARD
        </button>
        <button
          type="button"
          onClick={() => ed.publishAll()}
          className="mono-label rounded-pill bg-accent px-4 py-1.5 font-semibold text-paper transition-opacity hover:opacity-90"
        >
          PUBLISH →
        </button>

        <Divider />

        {/* Exit editing + sign out — clears the token and hides the bar. */}
        <button
          type="button"
          onClick={() => {
            if (ed.isDirty && !confirm("You have unsaved changes. Exit and sign out anyway? Unpublished edits will be lost."))
              return;
            ed.signOut();
          }}
          title="Exit editing & sign out"
          className="mono-label rounded-pill px-3 py-1.5 text-on-dark-muted transition-colors hover:bg-white/10 hover:text-on-dark"
        >
          EXIT ⏻
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-white/15" aria-hidden />;
}
