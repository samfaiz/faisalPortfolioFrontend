"use client";

/**
 * Phase 3 — revision diff + restore UI (PHASE_3 Track BE/FE:
 * "Full revision diff + restore UI").
 *
 * Builds on the existing write-client (revisions() + restore()) added in Phase 2.
 * Pick a revision to see a line diff of its snapshot against the current payload,
 * then restore it.
 *
 * WIRE-UP: the revisions list endpoint should include each revision's `snapshot`
 * (a P3 addition to API_CONTRACT §6). Without it, the picker + restore still work;
 * only the inline diff needs the snapshot.
 */
import { useCallback, useEffect, useState } from "react";
import type { EditableType, Revision } from "@/lib/editor/types";
import { createWriteClient, getToken } from "@/lib/editor/write-client";
import { lineDiff, stringifyPayload, type DiffLine } from "@/lib/editor/diff";

type RevisionWithSnapshot = Revision & { snapshot?: Record<string, unknown> };

export interface RevisionDiffProps {
  type: EditableType;
  id: string | number;
  /** The current (published or draft) payload to diff revisions against. */
  current: Record<string, unknown>;
  onRestored?: () => void;
}

const LINE_CLASS: Record<DiffLine["type"], string> = {
  equal: "text-muted",
  insert: "bg-accent/10 text-ink",
  delete: "bg-red-500/10 text-faint line-through",
};

export function RevisionDiff({ type, id, current, onRestored }: RevisionDiffProps) {
  const [revisions, setRevisions] = useState<RevisionWithSnapshot[]>([]);
  const [selected, setSelected] = useState<RevisionWithSnapshot | null>(null);
  // Lazy-init from the token so the mount effect never has to setState synchronously.
  const [status, setStatus] = useState<"idle" | "loading" | "restoring" | "error">(() =>
    getToken() ? "loading" : "error",
  );
  const [error, setError] = useState<string | null>(() =>
    getToken() ? null : "Not authenticated.",
  );

  // Fetch only; setState lives in the promise callbacks (the pattern effects want),
  // never synchronously in the effect body.
  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    createWriteClient(token)
      .revisions(type, id)
      .then((list) => {
        setRevisions(list as RevisionWithSnapshot[]);
        setStatus("idle");
      })
      .catch((e: unknown) => {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Failed to load revisions.");
      });
  }, [type, id]);

  useEffect(() => {
    load();
  }, [load]);

  // Manual refresh (event handler — safe to flip to "loading" synchronously).
  function refresh() {
    if (getToken()) setStatus("loading");
    void load();
  }

  async function restore(rev: RevisionWithSnapshot) {
    const token = getToken();
    if (!token) return;
    if (!window.confirm(`Restore revision from ${rev.created_at}? This replaces the current draft.`)) return;
    setStatus("restoring");
    try {
      await createWriteClient(token).restore(type, id, rev.id);
      onRestored?.();
      load();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Restore failed.");
    }
  }

  const diff: DiffLine[] | null = selected?.snapshot
    ? lineDiff(stringifyPayload(selected.snapshot), stringifyPayload(current))
    : null;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="mono-label text-muted">REVISION HISTORY</h3>
        <button onClick={refresh} className="mono-label text-accent hover:underline">
          REFRESH
        </button>
      </div>

      {status === "loading" ? <p className="text-faint">Loading…</p> : null}
      {status === "error" ? <p className="text-red-500">{error}</p> : null}
      {status === "idle" && revisions.length === 0 ? (
        <p className="text-faint">No revisions yet — publish to snapshot one.</p>
      ) : null}

      <ul className="divide-y divide-divider rounded-md border border-hairline">
        {revisions.map((rev) => (
          <li key={rev.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <button
              onClick={() => setSelected(selected?.id === rev.id ? null : rev)}
              className="min-w-0 text-left"
            >
              <span className="block truncate text-ink">{rev.label ?? `Revision #${rev.id}`}</span>
              <span className="mono-label block text-faint">
                {rev.created_at}
                {rev.user?.name ? ` · ${rev.user.name}` : ""}
              </span>
            </button>
            <button
              onClick={() => void restore(rev)}
              disabled={status === "restoring"}
              className="mono-label shrink-0 rounded border border-hairline px-2 py-1 text-accent transition-colors hover:border-accent disabled:opacity-50"
            >
              RESTORE
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <div className="rounded-md border border-hairline">
          <p className="mono-label border-b border-divider px-3 py-1.5 text-muted">
            DIFF · revision #{selected.id} → current
          </p>
          {diff ? (
            <pre className="max-h-80 overflow-auto p-3 font-mono text-xs leading-relaxed">
              {diff.map((line, i) => (
                <div key={i} className={LINE_CLASS[line.type]}>
                  <span className="select-none pr-2 text-faint">
                    {line.type === "insert" ? "+" : line.type === "delete" ? "-" : " "}
                  </span>
                  {line.text}
                </div>
              ))}
            </pre>
          ) : (
            <p className="p-3 text-faint">
              This revision has no snapshot in the payload yet — restore still works. See WIRE-UP.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
