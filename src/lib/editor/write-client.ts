/**
 * Authenticated write-API client for the inline editor (API_CONTRACT §1,§5,§6,§7).
 *
 * All calls send `Authorization: Bearer <sanctum>` and target the same
 * `/api/v1` base as the public read client. Writes go to the entity **draft**;
 * publish promotes draft -> live and snapshots a revision.
 *
 * This is intentionally decoupled from the public `lib/api.ts` (owned by the
 * FE worker) so the editor stays out of the public bundle (auth-gated, dynamic
 * import) and the two clients never collide.
 */
import type { FontOption, MediaAsset, Revision, EditableType } from "./types";
import { FALLBACK_FONTS } from "./fonts";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

/** localStorage key holding the Sanctum token issued at admin login. */
export const TOKEN_KEY = "cms_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    let code = "error";
    let message = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      code = json?.error?.code ?? code;
      message = json?.error?.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, code, message);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function createWriteClient(token: string) {
  return {
    /** PATCH a page section's draft (partial payload + optional `_styles`). */
    patchSection(key: string, partial: Record<string, unknown>) {
      return request<Record<string, unknown>>("PATCH", `/sections/${key}`, token, partial);
    },

    /** PATCH a collection item's draft. */
    patchItem(type: Exclude<EditableType, "sections">, id: number, partial: Record<string, unknown>) {
      return request<Record<string, unknown>>("PATCH", `/${type}/${id}`, token, partial);
    },

    /** Create a new collection item (returns the created draft). */
    createItem(type: Exclude<EditableType, "sections">, body: Record<string, unknown>) {
      return request<Record<string, unknown>>("POST", `/${type}`, token, body);
    },

    /** Delete a collection item. */
    deleteItem(type: Exclude<EditableType, "sections">, id: number) {
      return request<void>("DELETE", `/${type}/${id}`, token);
    },

    /** Persist a new order for a collection. */
    reorder(type: Exclude<EditableType, "sections">, ids: number[]) {
      return request<void>("POST", `/${type}/reorder`, token, { ids });
    },

    /** Promote draft -> live and snapshot a revision. */
    publish(type: EditableType, id: string | number) {
      return request<Record<string, unknown>>("POST", `/${type}/${id}/publish`, token);
    },

    unpublish(type: EditableType, id: string | number) {
      return request<Record<string, unknown>>("POST", `/${type}/${id}/unpublish`, token);
    },

    /** Discard the current draft (revert to published) — soft "unpublish draft". */
    revisions(type: EditableType, id: string | number) {
      return request<Revision[]>("GET", `/${type}/${id}/revisions`, token);
    },

    restore(type: EditableType, id: string | number, rev: number) {
      return request<Record<string, unknown>>(
        "POST",
        `/${type}/${id}/revisions/${rev}/restore`,
        token,
      );
    },

    /** Allowed-fonts whitelist for the toolbar (falls back to the bundled list). */
    async fonts(): Promise<FontOption[]> {
      try {
        return await request<FontOption[]>("GET", `/fonts`, token);
      } catch {
        return FALLBACK_FONTS;
      }
    },

    /** Upload a new media asset (multipart). Returns the created MediaAsset. */
    async uploadMedia(file: File): Promise<MediaAsset> {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BASE}/media`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        body: form,
        cache: "no-store",
      });
      if (!res.ok) throw new ApiError(res.status, "upload_failed", `Upload failed (${res.status})`);
      return (await res.json()) as MediaAsset;
    },

    /** List existing media assets for the picker. */
    async media(): Promise<MediaAsset[]> {
      try {
        return await request<MediaAsset[]>("GET", `/media`, token);
      } catch {
        return [];
      }
    },

    /** Swap an image on a field: set src + alt on the target's draft. */
    replaceImage(key: string, fieldPath: string, asset: MediaAsset) {
      return request<Record<string, unknown>>("PATCH", `/sections/${key}/replace-image`, token, {
        field: fieldPath,
        media_id: asset.id,
        alt: asset.alt ?? "",
      });
    },
  };
}

export type WriteClient = ReturnType<typeof createWriteClient>;
