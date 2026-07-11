/**
 * Phase 3 — concurrent-edit locking + autosave recovery (PHASE_3 Track FE:
 * "Conflict/locking handling for concurrent edits; robust autosave recovery").
 *
 * Two layers:
 *  1. Local autosave recovery — fully client-side (localStorage). Works today; it
 *     lets the editor recover unsaved changes after a crash/refresh.
 *  2. Server edit-locks — optimistic advisory locks so two admins don't stomp each
 *     other. The endpoints are a P3 addition to the API contract (see WIRE-UP);
 *     all calls fail soft so the editor still works before they exist.
 */
import { getToken } from "./write-client";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";
const DRAFT_PREFIX = "cms_autosave:";

/* --------------------------------- autosave recovery --------------------------------- */

export interface LocalDraft {
  payload: Record<string, unknown>;
  savedAt: string; // ISO
}

function draftKey(section: string): string {
  return `${DRAFT_PREFIX}${section}`;
}

/** Persist the working payload locally (debounced by the caller). */
export function saveLocalDraft(section: string, payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const entry: LocalDraft = { payload, savedAt: new Date().toISOString() };
    window.localStorage.setItem(draftKey(section), JSON.stringify(entry));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

export function loadLocalDraft(section: string): LocalDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(section));
    return raw ? (JSON.parse(raw) as LocalDraft) : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft(section: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(draftKey(section));
}

/** True if a locally-recoverable draft exists (offer "restore unsaved changes?"). */
export function hasRecoverableDraft(section: string): boolean {
  return loadLocalDraft(section) !== null;
}

/* ----------------------------------- server locks ------------------------------------ */

export interface EditLock {
  section: string;
  owner: string;
  acquired_at: string;
  expires_at: string;
  /** True when the lock is held by someone else. */
  held_by_other?: boolean;
}

/**
 * Try to acquire an advisory lock. Returns the lock, or null if unavailable / not
 * yet implemented on the backend. WIRE-UP: POST /api/v1/locks/{section}.
 */
export async function acquireLock(section: string): Promise<EditLock | null> {
  return lockRequest("POST", section);
}

/** Refresh the lock TTL. WIRE-UP: PUT /api/v1/locks/{section}. */
export async function renewLock(section: string): Promise<EditLock | null> {
  return lockRequest("PUT", section);
}

/** Release the lock. WIRE-UP: DELETE /api/v1/locks/{section}. */
export async function releaseLock(section: string): Promise<void> {
  await lockRequest("DELETE", section);
}

/**
 * Start a heartbeat that renews the lock on an interval. Returns a stop function
 * that also releases the lock. No-op-safe if locks aren't implemented yet.
 */
export function startLockHeartbeat(section: string, intervalMs = 30_000): () => void {
  if (typeof window === "undefined") return () => {};
  const id = window.setInterval(() => void renewLock(section), intervalMs);
  return () => {
    window.clearInterval(id);
    void releaseLock(section);
  };
}

async function lockRequest(method: string, section: string): Promise<EditLock | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}/locks/${encodeURIComponent(section)}`, {
      method,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 204 || !res.ok) return null;
    return (await res.json()) as EditLock;
  } catch {
    return null; // fail soft — locks are advisory
  }
}
