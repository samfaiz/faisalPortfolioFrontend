"use client";

/**
 * InlineEditorProvider — the edit-mode shell + state engine (Phase 2, Track FE).
 *
 * Holds the working **draft** for every page section rendered inside it, tracks
 * dirty fields, autosaves (debounced) to the write API, keeps an undo/redo
 * history, and drives publish/discard. Kept entirely client-side and auth-gated
 * so it never enters the public bundle.
 *
 * Wrap a page/subtree in <InlineEditorProvider initialSections={...}> and mark
 * elements with <Editable field="section.path"> to make them editable.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  createWriteClient,
  getToken,
  type WriteClient,
} from "@/lib/editor/write-client";
import { getByPath, getStyle, parseBinding, setByPath, setStyle } from "@/lib/editor/paths";
import { FALLBACK_FONTS } from "@/lib/editor/fonts";
import type { FontOption, SaveStatus, StyleOverride } from "@/lib/editor/types";

type SectionMap = Record<string, Record<string, unknown>>;

interface DocState {
  sections: SectionMap;
  past: SectionMap[];
  future: SectionMap[];
}

type DocAction =
  | { type: "set"; sections: SectionMap; snapshot: boolean }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; sections: SectionMap };

const HISTORY_LIMIT = 100;

function docReducer(state: DocState, action: DocAction): DocState {
  switch (action.type) {
    case "set": {
      const past = action.snapshot
        ? [...state.past, state.sections].slice(-HISTORY_LIMIT)
        : state.past;
      return { sections: action.sections, past, future: action.snapshot ? [] : state.future };
    }
    case "undo": {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        sections: previous,
        past: state.past.slice(0, -1),
        future: [state.sections, ...state.future].slice(0, HISTORY_LIMIT),
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        sections: next,
        past: [...state.past, state.sections].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
      };
    }
    case "reset":
      return { sections: action.sections, past: [], future: [] };
    default:
      return state;
  }
}

export interface EditorContextValue {
  enabled: boolean;
  editMode: boolean;
  setEditMode: (on: boolean) => void;

  getField: (binding: string) => unknown;
  setField: (binding: string, value: unknown, opts?: { commit?: boolean }) => void;
  getFieldStyle: (binding: string) => StyleOverride | undefined;
  setFieldStyle: (binding: string, patch: StyleOverride) => void;

  saveStatus: SaveStatus;
  dirtyCount: number;
  isDirty: boolean;

  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  publishAll: () => Promise<void>;
  discardAll: () => void;

  fonts: FontOption[];
  client: WriteClient | null;

  activeField: string | null;
  setActiveField: (binding: string | null) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within <InlineEditorProvider>");
  return ctx;
}

/** Safe variant for components that render both in and out of an editor tree. */
export function useOptionalEditor(): EditorContextValue | null {
  return useContext(EditorContext);
}

const SAVE_DEBOUNCE_MS = 800;
const HISTORY_COALESCE_MS = 700;

export function InlineEditorProvider({
  initialSections,
  token: tokenProp,
  localOnly = false,
  children,
}: {
  initialSections: SectionMap;
  /** Override the localStorage token (used by the demo route). */
  token?: string;
  /** Enable the editor chrome without a backend — edits stay in local state. */
  localOnly?: boolean;
  children: React.ReactNode;
}) {
  const [doc, dispatch] = useReducer(docReducer, {
    sections: initialSections,
    past: [],
    future: [],
  });
  const [editMode, setEditMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [fonts, setFonts] = useState<FontOption[]>(FALLBACK_FONTS);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(tokenProp ?? null);

  // Resolve the auth token on mount (localStorage), unless one was passed in.
  useEffect(() => {
    if (tokenProp || localOnly) return;
    setTokenState(getToken());
  }, [tokenProp, localOnly]);

  const client = useMemo<WriteClient | null>(
    () => (token && !localOnly ? createWriteClient(token) : null),
    [token, localOnly],
  );

  // Load the allowed-fonts whitelist the first time we enter edit mode.
  const fontsLoaded = useRef(false);
  useEffect(() => {
    if (!editMode || !client || fontsLoaded.current) return;
    fontsLoaded.current = true;
    client.fonts().then(setFonts).catch(() => setFonts(FALLBACK_FONTS));
  }, [editMode, client]);

  // ---- dirty tracking + debounced autosave -------------------------------
  const dirtyRef = useRef<Set<string>>(new Set());
  const [dirtyCount, setDirtyCount] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docRef = useRef(doc);
  docRef.current = doc;

  const flushSaves = useCallback(async () => {
    if (!client) {
      // No backend token (e.g. demo) — mark saved locally so UX still reads well.
      dirtyRef.current.clear();
      setDirtyCount(0);
      setSaveStatus("saved");
      return;
    }
    const keys = [...dirtyRef.current];
    if (!keys.length) return;
    setSaveStatus("saving");
    try {
      await Promise.all(
        keys.map((key) => client.patchSection(key, docRef.current.sections[key] ?? {})),
      );
      dirtyRef.current.clear();
      setDirtyCount(0);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [client]);

  const scheduleSave = useCallback(
    (sectionKey: string) => {
      dirtyRef.current.add(sectionKey);
      setDirtyCount(dirtyRef.current.size);
      setSaveStatus("dirty");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushSaves, SAVE_DEBOUNCE_MS);
    },
    [flushSaves],
  );

  // Coalesce rapid edits to the same field into one history entry.
  const lastEdit = useRef<{ field: string; at: number } | null>(null);

  const applyChange = useCallback(
    (sectionKey: string, nextSection: Record<string, unknown>, field: string, forceCommit: boolean) => {
      const now = Date.now();
      const last = lastEdit.current;
      const coalesce =
        !forceCommit && last?.field === field && now - last.at < HISTORY_COALESCE_MS;
      lastEdit.current = { field, at: now };

      dispatch({
        type: "set",
        sections: { ...docRef.current.sections, [sectionKey]: nextSection },
        snapshot: !coalesce,
      });
      scheduleSave(sectionKey);
    },
    [scheduleSave],
  );

  const getField = useCallback(
    (binding: string) => {
      const { section, path } = parseBinding(binding);
      return getByPath(doc.sections[section], path);
    },
    [doc.sections],
  );

  const setField = useCallback(
    (binding: string, value: unknown, opts?: { commit?: boolean }) => {
      const { section, path } = parseBinding(binding);
      const current = docRef.current.sections[section] ?? {};
      const next = setByPath(current, path, value);
      applyChange(section, next, binding, opts?.commit ?? false);
    },
    [applyChange],
  );

  const getFieldStyle = useCallback(
    (binding: string) => {
      const { section, leaf } = parseBinding(binding);
      return getStyle(doc.sections[section], leaf);
    },
    [doc.sections],
  );

  const setFieldStyle = useCallback(
    (binding: string, patch: StyleOverride) => {
      const { section, leaf } = parseBinding(binding);
      const current = docRef.current.sections[section] ?? {};
      const next = setStyle(current, leaf, patch);
      applyChange(section, next, `${binding}::style`, true);
    },
    [applyChange],
  );

  const discardAll = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    dirtyRef.current.clear();
    setDirtyCount(0);
    setSaveStatus("idle");
    dispatch({ type: "reset", sections: initialSections });
  }, [initialSections]);

  const publishAll = useCallback(async () => {
    await flushSaves();
    if (!client) {
      setSaveStatus("saved");
      return;
    }
    setSaveStatus("saving");
    try {
      await Promise.all(
        Object.keys(docRef.current.sections).map((key) => client.publish("sections", key)),
      );
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [client, flushSaves]);

  const isDirty = dirtyCount > 0 || saveStatus === "dirty" || saveStatus === "saving";

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Keyboard: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z redo (only in edit mode).
  useEffect(() => {
    if (!editMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      dispatch({ type: e.shiftKey ? "redo" : "undo" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editMode]);

  const value: EditorContextValue = {
    enabled: localOnly || !!token,
    editMode,
    setEditMode,
    getField,
    setField,
    getFieldStyle,
    setFieldStyle,
    saveStatus,
    dirtyCount,
    isDirty,
    canUndo: doc.past.length > 0,
    canRedo: doc.future.length > 0,
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    publishAll,
    discardAll,
    fonts,
    client,
    activeField,
    setActiveField,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
