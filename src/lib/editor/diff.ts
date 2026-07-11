/**
 * Phase 3 — dependency-free diff utilities for the revision diff/restore UI
 * (PHASE_3 Track BE/FE: "Full revision diff + restore UI").
 *
 * `lineDiff` is a classic LCS line diff (good enough for payload/prose review);
 * `fieldDiff` compares two JSON payloads field-by-field for a compact changelog.
 */

export type DiffOpType = "equal" | "insert" | "delete";

export interface DiffLine {
  type: DiffOpType;
  text: string;
}

/** Longest-common-subsequence line diff of two multi-line strings. */
export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;

  // LCS length table.
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const ops: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ type: "delete", text: a[i] });
      i++;
    } else {
      ops.push({ type: "insert", text: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "delete", text: a[i++] });
  while (j < m) ops.push({ type: "insert", text: b[j++] });

  return ops;
}

export interface FieldChange {
  path: string;
  before: unknown;
  after: unknown;
  kind: "added" | "removed" | "changed";
}

/** Shallow-ish JSON field diff (recurses into plain objects; arrays compared by value). */
export function fieldDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  prefix = "",
): FieldChange[] {
  const changes: FieldChange[] = [];
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);

  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const b = before?.[key];
    const a = after?.[key];

    if (isPlainObject(b) && isPlainObject(a)) {
      changes.push(...fieldDiff(b, a, path));
      continue;
    }

    const bJson = JSON.stringify(b);
    const aJson = JSON.stringify(a);
    if (bJson === aJson) continue;

    if (b === undefined) changes.push({ path, before: b, after: a, kind: "added" });
    else if (a === undefined) changes.push({ path, before: b, after: a, kind: "removed" });
    else changes.push({ path, before: b, after: a, kind: "changed" });
  }

  return changes;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Pretty-print any payload for the line-diff viewer. */
export function stringifyPayload(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}
