"use client";

/**
 * ImageReplaceModal — the media-library picker for inline image replace
 * (Phase 2, Track FE). Browse existing MediaAssets or upload a new one, then
 * pick to swap. Uses the write client when available; degrades to a URL-paste
 * field when there's no backend token (e.g. the demo).
 */
import { useEffect, useRef, useState } from "react";
import { useEditor } from "./InlineEditorProvider";
import type { MediaAsset } from "@/lib/editor/types";

export function ImageReplaceModal({
  open,
  onClose,
  onPick,
  currentAlt,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (asset: MediaAsset) => void;
  currentAlt?: string;
}) {
  const ed = useEditor();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [altValue, setAltValue] = useState(currentAlt ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !ed.client) return;
    setLoading(true);
    ed.client
      .media()
      .then(setAssets)
      .finally(() => setLoading(false));
  }, [open, ed.client]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleUpload(file: File) {
    if (!ed.client) return;
    setUploading(true);
    try {
      const asset = await ed.client.uploadMedia(file);
      setAssets((a) => [asset, ...a]);
      onPick({ ...asset, alt: altValue || asset.alt });
      onClose();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Replace image"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl overflow-hidden rounded-lg border-[1.5px] border-ink bg-surface shadow-offset"
      >
        <div className="flex items-center justify-between border-b border-divider px-5 py-3">
          <h2 className="mono-label font-semibold text-ink">REPLACE IMAGE</h2>
          <button onClick={onClose} className="mono-label rounded-sm px-2 py-1 text-muted-2 hover:bg-surface-alt">
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto p-5">
          {/* Alt text (applies to the chosen asset). */}
          <label className="mono-label mb-3 flex items-center gap-2 text-muted-2">
            ALT
            <input
              value={altValue}
              onChange={(e) => setAltValue(e.target.value)}
              placeholder="Describe the image (a11y + SEO)"
              className="flex-1 rounded-sm border border-hairline bg-surface px-2 py-1.5 font-[var(--font-display)] text-sm text-ink"
            />
          </label>

          {/* Upload */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={!ed.client || uploading}
              className="mono-label rounded-pill bg-ink px-4 py-2 font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {uploading ? "UPLOADING…" : "⤒ UPLOAD"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            {!ed.client && <span className="mono-label text-faint">(no backend — paste a URL below)</span>}
          </div>

          {/* URL paste fallback */}
          <div className="mb-5 flex gap-2">
            <input
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://…/image.jpg"
              className="flex-1 rounded-sm border border-hairline bg-surface px-2 py-1.5 text-sm text-ink"
            />
            <button
              type="button"
              disabled={!urlValue}
              onClick={() => {
                onPick({ id: 0, url: urlValue, alt: altValue });
                onClose();
              }}
              className="mono-label rounded-pill border-[1.5px] border-ink px-4 py-2 text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
            >
              USE URL
            </button>
          </div>

          {/* Existing library */}
          <div className="mono-label mb-2 text-faint">LIBRARY</div>
          {loading ? (
            <p className="mono-label text-faint">Loading…</p>
          ) : assets.length === 0 ? (
            <p className="mono-label text-faint">No media yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {assets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onPick({ ...a, alt: altValue || a.alt });
                    onClose();
                  }}
                  className="group overflow-hidden rounded-md border-[1.5px] border-hairline transition-colors hover:border-ink"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.alt ?? ""} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
